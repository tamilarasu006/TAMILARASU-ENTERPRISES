package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.dto.*;
import com.tamilarasu.ecommerce.entity.*;
import com.tamilarasu.ecommerce.exception.InsufficientStockException;
import com.tamilarasu.ecommerce.exception.PaymentFailedException;
import com.tamilarasu.ecommerce.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @Transactional
    public OrderDto checkout(Long userId, CheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Cart is empty"));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cart is empty");
        }

        // Validate inventory for all items before payment
        for (CartItem item : cartItems) {
            int available = inventoryService.getStock(item.getProduct().getId());
            if (available < item.getQuantity()) {
                throw new InsufficientStockException(
                        String.format("Insufficient stock for product ID %d. Available: %d, Requested: %d", 
                            item.getProduct().getId(), available, item.getQuantity()));
            }
        }

        // Calculate totals
        BigDecimal subtotal = cartItems.stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax);

        // Process payment — token is never stored
        boolean paymentSuccess = paymentService.processPayment(request.getPaymentToken(), total);
        if (!paymentSuccess) {
            throw new PaymentFailedException("Payment processing failed. Please check your payment details and try again.");
        }

        // Create order
        String orderNumber = generateOrderNumber();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .subtotal(subtotal)
                .tax(tax)
                .total(total)
                .status(OrderStatus.PENDING)
                .deliveryAddress(request.getDeliveryAddress())
                .contactPhone(request.getContactPhone())
                .build();

        Order savedOrder = orderRepository.save(order);

        // Create order items and decrement inventory
        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(cartItem.getProduct())
                    .productName(cartItem.getProduct().getName())
                    .unitPrice(cartItem.getProduct().getPrice())
                    .quantity(cartItem.getQuantity())
                    .build();
            orderItemRepository.save(orderItem);

            inventoryService.decrement(cartItem.getProduct().getId(), cartItem.getQuantity());
        }

        // Record initial status history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(savedOrder)
                .status(OrderStatus.PENDING)
                .reason("Order placed")
                .build();
        statusHistoryRepository.save(history);

        // Clear cart
        cartItemRepository.deleteAll(cartItems);

        // Send confirmation email
        OrderDto orderDto = toOrderDto(savedOrder);
        emailService.sendOrderConfirmation(user.getEmail(), orderDto);

        log.info("Order created: {} for user: {}", orderNumber, user.getEmail());
        return orderDto;
    }

    public List<OrderDto> getOrderHistory(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::toOrderDto)
                .collect(Collectors.toList());
    }

    public OrderDto getOrderDetail(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

        // Ensure the order belongs to the requesting user (unless admin)
        if (!order.getUser().getId().equals(userId)) {
            throw new SecurityException("Access denied to order: " + orderId);
        }

        return toOrderDto(order);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public OrderDto updateStatus(Long orderId, OrderStatus newStatus, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(newStatus)
                .reason(reason)
                .build();
        statusHistoryRepository.save(history);

        // Send notification email
        emailService.sendOrderStatusUpdate(
                order.getUser().getEmail(),
                order.getOrderNumber(),
                newStatus.name()
        );

        log.info("Order {} status changed from {} to {}", order.getOrderNumber(), oldStatus, newStatus);
        return toOrderDto(order);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public OrderDto cancelOrder(Long orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Order is already cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Restore inventory
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            inventoryService.restore(item.getProduct().getId(), item.getQuantity());
        }

        // Record status history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.CANCELLED)
                .reason(reason)
                .build();
        statusHistoryRepository.save(history);

        // Log refund initiation (real gateway integration point)
        log.info("Refund initiated for order: {} (reason: {})", order.getOrderNumber(), reason);

        // Notify customer
        emailService.sendOrderStatusUpdate(
                order.getUser().getEmail(),
                order.getOrderNumber(),
                "CANCELLED - " + reason
        );

        return toOrderDto(order);
    }

    public List<OrderDto> getFilteredOrders(OrderStatus status, LocalDateTime from, LocalDateTime to, String customer) {
        return orderRepository.findByFilters(status, from, to, customer).stream()
                .map(this::toOrderDto)
                .collect(Collectors.toList());
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "TE-" + timestamp + "-" + uuid;
    }

    private OrderDto toOrderDto(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<OrderItemDto> itemDtos = items.stream().map(item -> {
            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            return OrderItemDto.builder()
                    .productId(item.getProduct().getId())
                    .productName(item.getProductName())
                    .unitPrice(item.getUnitPrice())
                    .quantity(item.getQuantity())
                    .lineTotal(lineTotal)
                    .build();
        }).collect(Collectors.toList());

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus().name())
                .subtotal(order.getSubtotal())
                .tax(order.getTax())
                .total(order.getTotal())
                .deliveryAddress(order.getDeliveryAddress())
                .contactPhone(order.getContactPhone())
                .createdAt(order.getCreatedAt())
                .items(itemDtos)
                .build();
    }
}

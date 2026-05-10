package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.dto.CartDto;
import com.tamilarasu.ecommerce.dto.CartItemDto;
import com.tamilarasu.ecommerce.entity.*;
import com.tamilarasu.ecommerce.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");
    private static final int CART_EXPIRATION_DAYS = 30; // Carts expire after 30 days of inactivity

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public Cart getOrCreateCart(Long userId, String sessionId) {
        if (userId != null) {
            return cartRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        User user = userRepository.findById(userId)
                                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
                        Cart cart = Cart.builder().user(user).build();
                        return cartRepository.save(cart);
                    });
        } else if (sessionId != null) {
            return cartRepository.findBySessionId(sessionId)
                    .orElseGet(() -> {
                        Cart cart = Cart.builder().sessionId(sessionId).build();
                        return cartRepository.save(cart);
                    });
        }
        throw new IllegalArgumentException("Either userId or sessionId must be provided");
    }

    @Transactional
    public CartDto addItem(Long userId, String sessionId, Long productId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + productId));

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);
        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + 1);
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(1)
                    .build();
            cartItemRepository.save(item);
        }

        return getCart(userId, sessionId);
    }

    @Transactional
    public CartDto updateItem(Long userId, String sessionId, Long itemId, int qty) {
        Cart cart = getOrCreateCart(userId, sessionId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Cart item not found: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new SecurityException("Cart item does not belong to this cart");
        }

        if (qty <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(qty);
            cartItemRepository.save(item);
        }

        return getCart(userId, sessionId);
    }

    @Transactional
    public CartDto removeItem(Long userId, String sessionId, Long itemId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Cart item not found: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new SecurityException("Cart item does not belong to this cart");
        }

        cartItemRepository.delete(item);
        return getCart(userId, sessionId);
    }

    public CartDto getCart(Long userId, String sessionId) {
        Optional<Cart> cartOpt;
        if (userId != null) {
            cartOpt = cartRepository.findByUserId(userId);
        } else if (sessionId != null) {
            cartOpt = cartRepository.findBySessionId(sessionId);
        } else {
            return emptyCart();
        }

        return cartOpt.map(this::calculateTotals).orElse(emptyCart());
    }

    public CartDto calculateTotals(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());

        List<CartItemDto> itemDtos = items.stream().map(item -> {
            BigDecimal unitPrice = item.getProduct().getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            return CartItemDto.builder()
                    .itemId(item.getId())
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getName())
                    .unitPrice(unitPrice)
                    .quantity(item.getQuantity())
                    .lineTotal(lineTotal)
                    .build();
        }).collect(Collectors.toList());

        BigDecimal subtotal = itemDtos.stream()
                .map(CartItemDto::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax);

        return CartDto.builder()
                .cartId(cart.getId())
                .items(itemDtos)
                .subtotal(subtotal)
                .tax(tax)
                .total(total)
                .build();
    }

    @Transactional
    public void clearCart(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        cartItemRepository.deleteAll(items);
    }

    private CartDto emptyCart() {
        return CartDto.builder()
                .items(List.of())
                .subtotal(BigDecimal.ZERO)
                .tax(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .build();
    }

    /**
     * Merges a guest cart with a user's existing cart when they log in.
     * This implements the cart merging requirement for Task 5.5.
     * 
     * @param userId the user ID who is logging in
     * @param sessionId the session ID of the guest cart to merge
     * @return the merged cart DTO
     */
    @Transactional
    public CartDto mergeGuestCartOnLogin(Long userId, String sessionId) {
        log.info("Merging guest cart for session {} with user {}", sessionId, userId);
        
        // Get or create user cart
        Cart userCart = getOrCreateCart(userId, null);
        
        // Find guest cart by session ID
        Optional<Cart> guestCartOpt = cartRepository.findBySessionId(sessionId);
        if (guestCartOpt.isEmpty()) {
            log.debug("No guest cart found for session {}", sessionId);
            return getCart(userId, null);
        }
        
        Cart guestCart = guestCartOpt.get();
        List<CartItem> guestItems = cartItemRepository.findByCartId(guestCart.getId());
        
        if (guestItems.isEmpty()) {
            log.debug("Guest cart is empty for session {}", sessionId);
            // Clean up empty guest cart
            cartRepository.delete(guestCart);
            return getCart(userId, null);
        }
        
        // Merge items from guest cart to user cart
        for (CartItem guestItem : guestItems) {
            Optional<CartItem> existingUserItem = cartItemRepository
                    .findByCartIdAndProductId(userCart.getId(), guestItem.getProduct().getId());
            
            if (existingUserItem.isPresent()) {
                // Add quantities together
                CartItem userItem = existingUserItem.get();
                userItem.setQuantity(userItem.getQuantity() + guestItem.getQuantity());
                cartItemRepository.save(userItem);
                log.debug("Merged {} units of product {} into existing user cart item", 
                         guestItem.getQuantity(), guestItem.getProduct().getId());
            } else {
                // Move item to user cart
                guestItem.setCart(userCart);
                cartItemRepository.save(guestItem);
                log.debug("Moved {} units of product {} from guest cart to user cart", 
                         guestItem.getQuantity(), guestItem.getProduct().getId());
            }
        }
        
        // Delete the guest cart after merging
        cartRepository.delete(guestCart);
        log.info("Successfully merged guest cart and cleaned up session cart for user {}", userId);
        
        return getCart(userId, null);
    }

    /**
     * Scheduled task to clean up abandoned carts.
     * Runs daily at 2 AM to remove carts that haven't been updated in CART_EXPIRATION_DAYS.
     * This implements the automatic cart cleanup requirement for Task 5.5.
     */
    @Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
    @Transactional
    public void cleanupAbandonedCarts() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(CART_EXPIRATION_DAYS);
        log.info("Starting cleanup of abandoned carts older than {}", cutoffDate);
        
        // Find carts that haven't been updated in CART_EXPIRATION_DAYS
        List<Cart> abandonedCarts = cartRepository.findAbandonedCarts(cutoffDate);
        
        if (abandonedCarts.isEmpty()) {
            log.info("No abandoned carts found for cleanup");
            return;
        }
        
        int cleanedCount = 0;
        for (Cart cart : abandonedCarts) {
            try {
                // Clear cart items first
                clearCart(cart);
                // Delete the cart
                cartRepository.delete(cart);
                cleanedCount++;
                
                if (cart.getUser() != null) {
                    log.debug("Cleaned up abandoned cart for user {}", cart.getUser().getId());
                } else {
                    log.debug("Cleaned up abandoned guest cart with session {}", cart.getSessionId());
                }
            } catch (Exception e) {
                log.error("Failed to cleanup cart {}: {}", cart.getId(), e.getMessage());
            }
        }
        
        log.info("Cleanup completed. Removed {} abandoned carts", cleanedCount);
    }

    /**
     * Gets the number of items in a cart.
     * 
     * @param userId the user ID (can be null for guest)
     * @param sessionId the session ID (can be null for authenticated users)
     * @return the total number of items in the cart
     */
    public int getCartItemCount(Long userId, String sessionId) {
        Optional<Cart> cartOpt;
        if (userId != null) {
            cartOpt = cartRepository.findByUserId(userId);
        } else if (sessionId != null) {
            cartOpt = cartRepository.findBySessionId(sessionId);
        } else {
            return 0;
        }
        
        return cartOpt.map(cart -> {
            List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
            return items.stream().mapToInt(CartItem::getQuantity).sum();
        }).orElse(0);
    }

    /**
     * Checks if a cart is expired based on the expiration policy.
     * This implements the cart expiration policy requirement for Task 5.5.
     * 
     * @param cart the cart to check
     * @return true if the cart is expired, false otherwise
     */
    public boolean isCartExpired(Cart cart) {
        if (cart.getUpdatedAt() == null) {
            return false; // New carts are not expired
        }
        
        LocalDateTime expirationDate = cart.getUpdatedAt().plusDays(CART_EXPIRATION_DAYS);
        return LocalDateTime.now().isAfter(expirationDate);
    }
}

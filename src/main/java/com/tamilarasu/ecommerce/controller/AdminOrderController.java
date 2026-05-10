package com.tamilarasu.ecommerce.controller;

import com.tamilarasu.ecommerce.dto.OrderDto;
import com.tamilarasu.ecommerce.entity.OrderStatus;
import com.tamilarasu.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderDto>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String customer) {

        OrderStatus orderStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                orderStatus = OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // ignore invalid status filter
            }
        }

        return ResponseEntity.ok(orderService.getFilteredOrders(orderStatus, from, to, customer));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        String reason = body.getOrDefault("reason", "");
        OrderStatus newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(orderService.updateStatus(id, newStatus, reason));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderDto> cancelOrder(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Cancelled by admin");
        return ResponseEntity.ok(orderService.cancelOrder(id, reason));
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportOrders() {
        List<OrderDto> orders = orderService.getFilteredOrders(null, null, null, null);

        StringBuilder csv = new StringBuilder();
        csv.append("order_number,status,subtotal,tax,total,delivery_address,contact_phone,created_at,items\n");

        for (OrderDto order : orders) {
            String itemsSummary = order.getItems() != null
                    ? order.getItems().stream()
                        .map(i -> i.getProductName() + " x" + i.getQuantity())
                        .reduce((a, b) -> a + "; " + b)
                        .orElse("")
                    : "";

            csv.append(escapeCsv(order.getOrderNumber())).append(",");
            csv.append(order.getStatus()).append(",");
            csv.append(order.getSubtotal()).append(",");
            csv.append(order.getTax()).append(",");
            csv.append(order.getTotal()).append(",");
            csv.append(escapeCsv(order.getDeliveryAddress())).append(",");
            csv.append(escapeCsv(order.getContactPhone())).append(",");
            csv.append(order.getCreatedAt()).append(",");
            csv.append(escapeCsv(itemsSummary)).append("\n");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "orders_export.csv");

        return ResponseEntity.ok().headers(headers).body(csv.toString());
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

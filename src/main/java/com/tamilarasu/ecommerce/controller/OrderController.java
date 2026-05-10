package com.tamilarasu.ecommerce.controller;

import com.tamilarasu.ecommerce.dto.CheckoutRequest;
import com.tamilarasu.ecommerce.dto.OrderDto;
import com.tamilarasu.ecommerce.entity.User;
import com.tamilarasu.ecommerce.repository.UserRepository;
import com.tamilarasu.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping("/checkout")
    public ResponseEntity<OrderDto> checkout(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        OrderDto order = orderService.checkout(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    public ResponseEntity<List<OrderDto>> getOrderHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(orderService.getOrderHistory(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrderDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(orderService.getOrderDetail(id, userId));
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new SecurityException("Authentication required");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
    }
}

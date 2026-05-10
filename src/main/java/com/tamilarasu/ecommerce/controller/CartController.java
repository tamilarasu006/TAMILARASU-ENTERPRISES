package com.tamilarasu.ecommerce.controller;

import com.tamilarasu.ecommerce.dto.CartDto;
import com.tamilarasu.ecommerce.entity.User;
import com.tamilarasu.ecommerce.repository.UserRepository;
import com.tamilarasu.ecommerce.service.CartService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<CartDto> getCart(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpSession session) {
        Long userId = getUserId(userDetails);
        String sessionId = userId == null ? session.getId() : null;
        return ResponseEntity.ok(cartService.getCart(userId, sessionId));
    }

    @PostMapping("/items")
    public ResponseEntity<CartDto> addItem(
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpSession session) {
        Long productId = body.get("productId");
        Long userId = getUserId(userDetails);
        String sessionId = userId == null ? session.getId() : null;
        return ResponseEntity.ok(cartService.addItem(userId, sessionId, productId));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<CartDto> updateItem(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpSession session) {
        int quantity = body.getOrDefault("quantity", 1);
        Long userId = getUserId(userDetails);
        String sessionId = userId == null ? session.getId() : null;
        return ResponseEntity.ok(cartService.updateItem(userId, sessionId, id, quantity));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<CartDto> removeItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpSession session) {
        Long userId = getUserId(userDetails);
        String sessionId = userId == null ? session.getId() : null;
        return ResponseEntity.ok(cartService.removeItem(userId, sessionId, id));
    }

    @PostMapping("/merge")
    public ResponseEntity<CartDto> mergeGuestCart(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String guestSessionId = body.get("sessionId");
        Long userId = getUserId(userDetails);
        
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(cartService.mergeGuestCartOnLogin(userId, guestSessionId));
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getCartItemCount(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpSession session) {
        Long userId = getUserId(userDetails);
        String sessionId = userId == null ? session.getId() : null;
        return ResponseEntity.ok(cartService.getCartItemCount(userId, sessionId));
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}

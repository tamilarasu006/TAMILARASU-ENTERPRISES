package com.tamilarasu.ecommerce.controller;

import com.tamilarasu.ecommerce.dto.ProductSummaryDto;
import com.tamilarasu.ecommerce.entity.Inventory;
import com.tamilarasu.ecommerce.entity.Product;
import com.tamilarasu.ecommerce.repository.InventoryRepository;
import com.tamilarasu.ecommerce.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/inventory")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminInventoryController {

    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepository;

    @PutMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> updateStock(
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> body) {
        int quantity = body.getOrDefault("quantity", 0);
        inventoryService.updateStock(productId, quantity);
        return ResponseEntity.ok(Map.of(
                "productId", productId,
                "quantity", quantity,
                "message", "Stock updated successfully"
        ));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Map<String, Object>>> getLowStockProducts() {
        List<Product> products = inventoryService.getLowStockProducts();
        List<Map<String, Object>> result = products.stream().map(p -> {
            int qty = inventoryService.getStock(p.getId());
            return Map.<String, Object>of(
                    "productId", p.getId(),
                    "productName", p.getName(),
                    "quantity", qty,
                    "outOfStock", qty == 0
            );
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}

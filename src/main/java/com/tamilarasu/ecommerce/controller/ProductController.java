package com.tamilarasu.ecommerce.controller;

import com.tamilarasu.ecommerce.dto.ProductDetailDto;
import com.tamilarasu.ecommerce.dto.ProductSummaryDto;
import com.tamilarasu.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductSummaryDto>> getProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(productService.getProducts(q, categoryId, sort, page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailDto> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDetail(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page) {

        Page<ProductSummaryDto> results = productService.getProducts(q, categoryId, sort, page);
        List<String> suggestions = productService.getSuggestions(q);

        return ResponseEntity.ok(Map.of(
                "results", results,
                "suggestions", suggestions
        ));
    }
}

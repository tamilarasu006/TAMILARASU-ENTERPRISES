package com.tamilarasu.ecommerce.controller;

import com.tamilarasu.ecommerce.dto.ProductDetailDto;
import com.tamilarasu.ecommerce.dto.ProductRequest;
import com.tamilarasu.ecommerce.entity.Category;
import com.tamilarasu.ecommerce.entity.Product;
import com.tamilarasu.ecommerce.repository.CategoryRepository;
import com.tamilarasu.ecommerce.repository.ProductRepository;
import com.tamilarasu.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/products")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminProductController {

    private final ProductService productService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @PostMapping
    public ResponseEntity<ProductDetailDto> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDetailDto> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateProduct(@PathVariable Long id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importCsv(@RequestParam("file") MultipartFile file) {
        List<Map<String, String>> errors = new ArrayList<>();
        List<ProductDetailDto> created = new ArrayList<>();
        int rowNum = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
            }

            String line;
            while ((line = reader.readLine()) != null) {
                rowNum++;
                String[] cols = line.split(",", -1);
                Map<String, String> rowErrors = validateCsvRow(cols, rowNum);
                if (!rowErrors.isEmpty()) {
                    errors.add(rowErrors);
                    continue;
                }

                try {
                    String name = cols[0].trim();
                    String description = cols.length > 1 ? cols[1].trim() : "";
                    BigDecimal price = new BigDecimal(cols[2].trim());
                    String categorySlug = cols[3].trim();

                    Optional<Category> categoryOpt = categoryRepository.findBySlug(categorySlug);
                    if (categoryOpt.isEmpty()) {
                        errors.add(Map.of("row", String.valueOf(rowNum), "error", "Category not found: " + categorySlug));
                        continue;
                    }

                    List<String> imageUrls = new ArrayList<>();
                    for (int i = 4; i < Math.min(cols.length, 9); i++) {
                        if (!cols[i].trim().isEmpty()) {
                            imageUrls.add(cols[i].trim());
                        }
                    }

                    ProductRequest request = ProductRequest.builder()
                            .name(name)
                            .description(description)
                            .price(price)
                            .categoryId(categoryOpt.get().getId())
                            .imageUrls(imageUrls)
                            .build();

                    created.add(productService.createProduct(request));
                } catch (Exception e) {
                    errors.add(Map.of("row", String.valueOf(rowNum), "error", e.getMessage()));
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process CSV: " + e.getMessage()));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("imported", created.size());
        response.put("errors", errors);
        if (!errors.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportCsv() {
        List<Product> products = productRepository.findByActiveTrue(
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        StringBuilder csv = new StringBuilder();
        csv.append("id,name,description,price,category,image_url_1,image_url_2,image_url_3,image_url_4,image_url_5,quantity,out_of_stock\n");

        for (Product p : products) {
            csv.append(p.getId()).append(",");
            csv.append(escapeCsv(p.getName())).append(",");
            csv.append(escapeCsv(p.getDescription())).append(",");
            csv.append(p.getPrice()).append(",");
            csv.append(escapeCsv(p.getCategory() != null ? p.getCategory().getName() : "")).append(",");
            // Images and inventory would need additional queries — simplified here
            csv.append(",,,,,");
            csv.append("0,false\n");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "products_export.csv");

        return ResponseEntity.ok().headers(headers).body(csv.toString());
    }

    private Map<String, String> validateCsvRow(String[] cols, int rowNum) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (cols.length < 4) {
            errors.put("row", String.valueOf(rowNum));
            errors.put("error", "Insufficient columns (expected at least 4: name, description, price, category_slug)");
            return errors;
        }
        if (cols[0].trim().isEmpty()) {
            errors.put("row", String.valueOf(rowNum));
            errors.put("error", "Name is required");
        }
        if (cols[2].trim().isEmpty()) {
            errors.put("row", String.valueOf(rowNum));
            errors.put("error", "Price is required");
        } else {
            try {
                BigDecimal price = new BigDecimal(cols[2].trim());
                if (price.compareTo(BigDecimal.ZERO) <= 0) {
                    errors.put("row", String.valueOf(rowNum));
                    errors.put("error", "Price must be positive");
                }
            } catch (NumberFormatException e) {
                errors.put("row", String.valueOf(rowNum));
                errors.put("error", "Invalid price format");
            }
        }
        if (cols[3].trim().isEmpty()) {
            errors.put("row", String.valueOf(rowNum));
            errors.put("error", "Category slug is required");
        }
        return errors;
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

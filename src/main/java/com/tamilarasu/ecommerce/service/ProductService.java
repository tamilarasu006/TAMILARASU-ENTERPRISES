package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.dto.ProductDetailDto;
import com.tamilarasu.ecommerce.dto.ProductRequest;
import com.tamilarasu.ecommerce.dto.ProductSummaryDto;
import com.tamilarasu.ecommerce.entity.*;
import com.tamilarasu.ecommerce.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private static final int PAGE_SIZE = 20;
    private static final int SUGGESTION_LIMIT = 5;

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;

    public Page<ProductSummaryDto> getProducts(String q, Long categoryId, String sort, int page) {
        Pageable pageable = buildPageable(sort, page);
        Page<Product> products;

        if (q != null && !q.isBlank()) {
            if (categoryId != null) {
                products = productRepository.searchProductsByCategory(q, categoryId, pageable);
            } else {
                products = productRepository.searchProducts(q, pageable);
            }
        } else {
            if (categoryId != null) {
                products = productRepository.findByActiveTrueAndCategoryId(categoryId, pageable);
            } else {
                products = productRepository.findByActiveTrue(pageable);
            }
        }

        return products.map(this::toSummaryDto);
    }

    public ProductDetailDto getProductDetail(Long id) {
        Product product = productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));

        return toDetailDto(product);
    }

    public List<String> getSuggestions(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return List.of();
        }
        Pageable pageable = PageRequest.of(0, SUGGESTION_LIMIT);
        return productRepository.findNamesByPrefix(prefix, pageable);
    }

    @Transactional
    public ProductDetailDto createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + request.getCategoryId()));

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(category)
                .active(true)
                .build();

        Product saved = productRepository.save(product);

        // Save images
        if (request.getImageUrls() != null) {
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                ProductImage image = ProductImage.builder()
                        .product(saved)
                        .url(request.getImageUrls().get(i))
                        .sortOrder(i)
                        .build();
                productImageRepository.save(image);
            }
        }

        // Create inventory record
        int initialStock = request.getInitialStock() != null ? request.getInitialStock() : 0;
        Inventory inventory = Inventory.builder()
                .product(saved)
                .quantity(initialStock)
                .outOfStock(initialStock <= 0)
                .build();
        inventoryRepository.save(inventory);

        log.info("Created product: {} (id={})", saved.getName(), saved.getId());
        return toDetailDto(saved);
    }

    @Transactional
    public ProductDetailDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + request.getCategoryId()));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(category);

        Product saved = productRepository.save(product);

        // Update images
        if (request.getImageUrls() != null) {
            productImageRepository.deleteByProductId(id);
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                ProductImage image = ProductImage.builder()
                        .product(saved)
                        .url(request.getImageUrls().get(i))
                        .sortOrder(i)
                        .build();
                productImageRepository.save(image);
            }
        }

        log.info("Updated product: {} (id={})", saved.getName(), saved.getId());
        return toDetailDto(saved);
    }

    @Transactional
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));
        product.setActive(false);
        productRepository.save(product);
        log.info("Deactivated product: {} (id={})", product.getName(), id);
    }

    private Pageable buildPageable(String sort, int page) {
        Sort sortOrder;
        if (sort == null || sort.isBlank()) {
            sortOrder = Sort.by(Sort.Direction.DESC, "createdAt");
        } else {
            sortOrder = switch (sort.toLowerCase()) {
                case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
                case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
                case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
                case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
                case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
                default -> Sort.by(Sort.Direction.DESC, "createdAt");
            };
        }
        return PageRequest.of(Math.max(0, page), PAGE_SIZE, sortOrder);
    }

    private ProductSummaryDto toSummaryDto(Product product) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
        String imageUrl = images.isEmpty() ? null : images.get(0).getUrl();

        boolean outOfStock = inventoryRepository.findByProductId(product.getId())
                .map(Inventory::isOutOfStock)
                .orElse(true);

        return ProductSummaryDto.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .imageUrl(imageUrl)
                .outOfStock(outOfStock)
                .build();
    }

    private ProductDetailDto toDetailDto(Product product) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
        List<String> imageUrls = images.stream().map(ProductImage::getUrl).collect(Collectors.toList());

        var inventoryOpt = inventoryRepository.findByProductId(product.getId());
        boolean outOfStock = inventoryOpt.map(Inventory::isOutOfStock).orElse(true);
        int quantity = inventoryOpt.map(Inventory::getQuantity).orElse(0);

        return ProductDetailDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .images(imageUrls)
                .outOfStock(outOfStock)
                .quantity(quantity)
                .createdAt(product.getCreatedAt())
                .build();
    }
}

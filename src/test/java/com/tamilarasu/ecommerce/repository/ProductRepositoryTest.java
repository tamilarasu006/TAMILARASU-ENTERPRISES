package com.tamilarasu.ecommerce.repository;

import com.tamilarasu.ecommerce.entity.Category;
import com.tamilarasu.ecommerce.entity.Product;
import com.tamilarasu.ecommerce.entity.ProductImage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for Product, Category, and ProductImage repositories
 * Tests repository methods and database interactions
 */
@DataJpaTest
class ProductRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    private Category category;
    private Product activeProduct;
    private Product inactiveProduct;

    @BeforeEach
    void setUp() {
        // Create and persist category
        category = Category.builder()
                .name("Electronics")
                .slug("electronics")
                .build();
        category = entityManager.persistAndFlush(category);

        // Create and persist active product
        activeProduct = Product.builder()
                .name("Active Product")
                .description("This is an active product")
                .price(new BigDecimal("99.99"))
                .category(category)
                .active(true)
                .build();
        activeProduct = entityManager.persistAndFlush(activeProduct);

        // Create and persist inactive product
        inactiveProduct = Product.builder()
                .name("Inactive Product")
                .description("This is an inactive product")
                .price(new BigDecimal("49.99"))
                .category(category)
                .active(false)
                .build();
        inactiveProduct = entityManager.persistAndFlush(inactiveProduct);

        // Create and persist product images
        ProductImage image1 = ProductImage.builder()
                .product(activeProduct)
                .url("https://example.com/image1.jpg")
                .sortOrder(1)
                .build();
        entityManager.persistAndFlush(image1);

        ProductImage image2 = ProductImage.builder()
                .product(activeProduct)
                .url("https://example.com/image2.jpg")
                .sortOrder(2)
                .build();
        entityManager.persistAndFlush(image2);

        entityManager.clear();
    }

    @Test
    void testFindByActiveTrue() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> activePage = productRepository.findByActiveTrue(pageable);

        assertEquals(1, activePage.getTotalElements());
        assertEquals("Active Product", activePage.getContent().get(0).getName());
    }

    @Test
    void testFindByActiveTrueAndCategoryId() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> categoryPage = productRepository.findByActiveTrueAndCategoryId(category.getId(), pageable);

        assertEquals(1, categoryPage.getTotalElements());
        assertEquals("Active Product", categoryPage.getContent().get(0).getName());
    }

    @Test
    void testSearchProducts() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> searchResults = productRepository.searchProducts("active", pageable);

        assertEquals(1, searchResults.getTotalElements());
        assertEquals("Active Product", searchResults.getContent().get(0).getName());
    }

    @Test
    void testSearchProductsByCategory() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> searchResults = productRepository.searchProductsByCategory("active", category.getId(), pageable);

        assertEquals(1, searchResults.getTotalElements());
        assertEquals("Active Product", searchResults.getContent().get(0).getName());
    }

    @Test
    void testFindNamesByPrefix() {
        Pageable pageable = PageRequest.of(0, 10);
        List<String> names = productRepository.findNamesByPrefix("Act", pageable);

        assertEquals(1, names.size());
        assertEquals("Active Product", names.get(0));
    }

    @Test
    void testCategoryRepository() {
        // Test finding category by slug
        var foundCategory = categoryRepository.findBySlug("electronics");
        assertTrue(foundCategory.isPresent());
        assertEquals("Electronics", foundCategory.get().getName());

        // Test finding all categories
        List<Category> allCategories = categoryRepository.findAll();
        assertEquals(1, allCategories.size());
    }

    @Test
    void testProductImageRepository() {
        // Test finding images by product ID ordered by sort order
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrder(activeProduct.getId());

        assertEquals(2, images.size());
        assertEquals(1, images.get(0).getSortOrder());
        assertEquals(2, images.get(1).getSortOrder());
        assertEquals("https://example.com/image1.jpg", images.get(0).getUrl());
        assertEquals("https://example.com/image2.jpg", images.get(1).getUrl());
    }

    @Test
    void testProductImageDeletion() {
        // Verify images exist
        List<ProductImage> imagesBefore = productImageRepository.findByProductIdOrderBySortOrder(activeProduct.getId());
        assertEquals(2, imagesBefore.size());

        // Delete images by product ID
        productImageRepository.deleteByProductId(activeProduct.getId());
        entityManager.flush();

        // Verify images are deleted
        List<ProductImage> imagesAfter = productImageRepository.findByProductIdOrderBySortOrder(activeProduct.getId());
        assertEquals(0, imagesAfter.size());
    }

    @Test
    void testProductCategoryRelationship() {
        Product foundProduct = productRepository.findById(activeProduct.getId()).orElse(null);
        assertNotNull(foundProduct);
        assertNotNull(foundProduct.getCategory());
        assertEquals("Electronics", foundProduct.getCategory().getName());
        assertEquals("electronics", foundProduct.getCategory().getSlug());
    }
}
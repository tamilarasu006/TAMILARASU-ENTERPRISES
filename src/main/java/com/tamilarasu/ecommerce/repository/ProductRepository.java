package com.tamilarasu.ecommerce.repository;

import com.tamilarasu.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByActiveTrueAndCategoryId(Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Product> searchProducts(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "p.category.id = :categoryId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Product> searchProductsByCategory(@Param("q") String q, @Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT p.name FROM Product p WHERE p.active = true AND LOWER(p.name) LIKE LOWER(CONCAT(:prefix, '%')) ORDER BY p.name")
    List<String> findNamesByPrefix(@Param("prefix") String prefix, Pageable pageable);
}

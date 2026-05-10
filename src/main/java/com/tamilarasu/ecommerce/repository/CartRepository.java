package com.tamilarasu.ecommerce.repository;

import com.tamilarasu.ecommerce.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByUserId(Long userId);

    Optional<Cart> findBySessionId(String sessionId);

    @Query("SELECT c FROM Cart c WHERE c.updatedAt < :cutoffDate")
    List<Cart> findAbandonedCarts(@Param("cutoffDate") LocalDateTime cutoffDate);
}

package com.tamilarasu.ecommerce.repository;

import com.tamilarasu.ecommerce.entity.Order;
import com.tamilarasu.ecommerce.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:from IS NULL OR o.createdAt >= :from) AND " +
           "(:to IS NULL OR o.createdAt <= :to) AND " +
           "(:customer IS NULL OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :customer, '%')) OR " +
           "LOWER(o.user.name) LIKE LOWER(CONCAT('%', :customer, '%')))")
    List<Order> findByFilters(
            @Param("status") OrderStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("customer") String customer
    );
}

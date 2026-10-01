package com.appetite.order;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"restaurant", "customer"})
    List<Order> findTop50ByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    @EntityGraph(attributePaths = {"restaurant", "customer"})
    List<Order> findTop100ByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    @EntityGraph(attributePaths = {"restaurant", "customer"})
    Optional<Order> findByIdAndCustomerEmailIgnoreCase(Long id, String email);

    @EntityGraph(attributePaths = {"restaurant", "customer"})
    Optional<Order> findByIdAndRestaurantId(Long id, Long restaurantId);

    long countByCustomerEmailIgnoreCaseAndStatus(String email, OrderStatus status);
}

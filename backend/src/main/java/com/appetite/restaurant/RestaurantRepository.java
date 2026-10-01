package com.appetite.restaurant;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    @EntityGraph(attributePaths = {"owner", "paymentMethods", "serviceOptions"})
    List<Restaurant> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"owner", "paymentMethods", "serviceOptions"})
    Optional<Restaurant> findByOwnerEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"owner", "paymentMethods", "serviceOptions"})
    Optional<Restaurant> findWithDetailsById(Long id);
}

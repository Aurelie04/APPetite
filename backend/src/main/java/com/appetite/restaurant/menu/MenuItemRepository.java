package com.appetite.restaurant.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByRestaurantIdOrderByCategoryAscNameAsc(Long restaurantId);

    List<MenuItem> findByRestaurantIdAndAvailableTrueOrderByCategoryAscNameAsc(Long restaurantId);

    Optional<MenuItem> findByIdAndRestaurantId(Long id, Long restaurantId);

    long countByRestaurantId(Long restaurantId);

    @Query("""
            select m.restaurant.id as restaurantId, m.kind as kind, count(m) as itemCount, min(m.price) as minPrice
            from MenuItem m
            where m.available = true
            group by m.restaurant.id, m.kind
            """)
    List<MenuStats> availableStats();

    @Query("""
            select m.restaurant.id as restaurantId, m.kind as kind, count(m) as itemCount, min(m.price) as minPrice
            from MenuItem m
            where m.available = true and m.restaurant.id = :restaurantId
            group by m.restaurant.id, m.kind
            """)
    List<MenuStats> availableStatsFor(@Param("restaurantId") Long restaurantId);

    interface MenuStats {
        Long getRestaurantId();
        MenuItemKind getKind();
        long getItemCount();
        BigDecimal getMinPrice();
    }
}

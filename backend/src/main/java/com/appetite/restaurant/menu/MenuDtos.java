package com.appetite.restaurant.menu;

import com.appetite.common.validation.ValidationPatterns;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class MenuDtos {

    private MenuDtos() {
    }

    public record MenuItemDto(
            Long id,
            String name,
            String description,
            MenuItemKind kind,
            String category,
            BigDecimal price,
            boolean available
    ) {
        public static MenuItemDto from(MenuItem item) {
            return new MenuItemDto(item.getId(), item.getName(), item.getDescription(), item.getKind(),
                    item.getCategory(), item.getPrice(), item.isAvailable());
        }
    }

    public record MenuItemRequest(
            @NotBlank(message = "Item name is required")
            @Size(max = 80, message = "Item name must be at most 80 characters")
            @Pattern(regexp = ValidationPatterns.SAFE_TEXT, message = "Item name must not contain < or >")
            String name,

            @Size(max = 300, message = "Description must be at most 300 characters")
            @Pattern(regexp = ValidationPatterns.SAFE_TEXT, message = "Description must not contain < or >")
            String description,

            @NotNull(message = "Choose food or beverage")
            MenuItemKind kind,

            @Size(max = 40, message = "Category must be at most 40 characters")
            @Pattern(regexp = ValidationPatterns.SAFE_TEXT, message = "Category must not contain < or >")
            String category,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.00", message = "Price cannot be negative")
            @DecimalMax(value = "99999.99", message = "Price must be at most 99 999.99")
            @Digits(integer = 5, fraction = 2, message = "Price can have at most 2 decimals")
            BigDecimal price,

            Boolean available
    ) {
    }
}

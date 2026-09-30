package com.appetite.restaurant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class RestaurantDtos {

    private RestaurantDtos() {
    }

    public record RestaurantDto(
            Long id,
            String name,
            String description,
            String cuisine,
            String address,
            String phone,
            String ownerName,
            Instant createdAt
    ) {
        public static RestaurantDto from(Restaurant r) {
            return new RestaurantDto(r.getId(), r.getName(), r.getDescription(), r.getCuisine(), r.getAddress(),
                    r.getPhone(), r.getOwner().getFullName(), r.getCreatedAt());
        }
    }

    public record UpdateRestaurantRequest(
            @NotBlank(message = "Restaurant name is required")
            @Size(max = 120, message = "Restaurant name must be at most 120 characters")
            String name,

            @Size(max = 500, message = "Description must be at most 500 characters")
            String description,

            @Size(max = 60, message = "Cuisine must be at most 60 characters")
            String cuisine,

            @Size(max = 200, message = "Address must be at most 200 characters")
            String address,

            @Pattern(regexp = "^$|^[+0-9 ()-]{6,20}$", message = "Phone number is not valid")
            String phone
    ) {
    }
}

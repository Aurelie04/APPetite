package com.appetite.restaurant;

import com.appetite.common.validation.ValidationPatterns;
import com.appetite.restaurant.menu.MenuDtos.MenuItemDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Set;

public final class RestaurantDtos {

    private RestaurantDtos() {
    }

    /** Available-menu summary shown on restaurant cards. */
    public record MenuSummary(long foodCount, long beverageCount, BigDecimal priceFrom) {
        public static final MenuSummary EMPTY = new MenuSummary(0, 0, null);
    }

    public record RestaurantDto(
            Long id,
            String name,
            String description,
            String cuisine,
            String address,
            String phone,
            String ownerName,
            Instant createdAt,
            String logoUrl,
            String currency,
            String openingHours,
            List<PaymentMethod> paymentMethods,
            List<ServiceOption> serviceOptions,
            MenuSummary menu
    ) {
        public static RestaurantDto from(Restaurant r, MenuSummary menu) {
            String logoUrl = r.getLogoVersion() == null
                    ? null
                    : "/api/restaurants/" + r.getId() + "/logo?v=" + r.getLogoVersion();
            return new RestaurantDto(r.getId(), r.getName(), r.getDescription(), r.getCuisine(), r.getAddress(),
                    r.getPhone(), r.getOwner().getFullName(), r.getCreatedAt(), logoUrl, r.getCurrency(),
                    r.getOpeningHours(), sorted(r.getPaymentMethods()), sorted(r.getServiceOptions()), menu);
        }

        private static <E extends Enum<E>> List<E> sorted(Collection<E> values) {
            return values.stream().sorted().toList();
        }
    }

    public record RestaurantDetailDto(RestaurantDto restaurant, List<MenuItemDto> menu) {
    }

    public record UpdateRestaurantRequest(
            @NotBlank(message = "Restaurant name is required")
            @Pattern(regexp = ValidationPatterns.RESTAURANT_NAME,
                    message = "Restaurant name must be 2-120 characters (letters, numbers, spaces and & ' . , ! -)")
            String name,

            @Size(max = 500, message = "Description must be at most 500 characters")
            @Pattern(regexp = ValidationPatterns.SAFE_TEXT, message = "Description must not contain < or >")
            String description,

            @Size(max = 60, message = "Cuisine must be at most 60 characters")
            String cuisine,

            @Size(max = 200, message = "Address must be at most 200 characters")
            @Pattern(regexp = ValidationPatterns.SAFE_TEXT, message = "Address must not contain < or >")
            String address,

            @Pattern(regexp = ValidationPatterns.PHONE_OPTIONAL, message = "Phone number is not valid")
            String phone,

            @Pattern(regexp = ValidationPatterns.CURRENCY, message = "Please choose a supported currency")
            String currency,

            @Size(max = 120, message = "Opening hours must be at most 120 characters")
            @Pattern(regexp = ValidationPatterns.SAFE_TEXT, message = "Opening hours must not contain < or >")
            String openingHours
    ) {
    }

    public record UpdateOptionsRequest(
            @NotEmpty(message = "Choose at least one payment method")
            Set<PaymentMethod> paymentMethods,

            Set<ServiceOption> serviceOptions
    ) {
    }
}

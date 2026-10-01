package com.appetite.order;

import com.appetite.common.validation.ValidationPatterns;
import com.appetite.restaurant.PaymentMethod;
import com.appetite.restaurant.Restaurant;
import com.appetite.restaurant.ServiceOption;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {

    static final int MAX_QUANTITY = 20;
    static final int MAX_LINES = 30;

    private OrderDtos() {
    }

    public record OrderLineRequest(
            @NotNull(message = "Choose an item")
            Long menuItemId,

            @NotNull(message = "Choose a quantity")
            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = MAX_QUANTITY, message = "You can order at most " + MAX_QUANTITY + " of the same item")
            Integer quantity
    ) {
    }

    public record PlaceOrderRequest(
            @NotNull(message = "Choose a restaurant")
            Long restaurantId,

            @NotEmpty(message = "Your cart is empty")
            @Size(max = MAX_LINES, message = "An order can have at most " + MAX_LINES + " different items")
            List<@Valid @NotNull OrderLineRequest> items,

            @NotNull(message = "Choose delivery, takeaway or dine-in")
            ServiceOption serviceOption,

            @NotNull(message = "Choose a payment method")
            PaymentMethod paymentMethod,

            @Size(max = 200, message = "Address must be at most 200 characters")
            @Pattern(regexp = ValidationPatterns.SAFE_TEXT, message = "Address must not contain < or >")
            String deliveryAddress,

            @Pattern(regexp = ValidationPatterns.PHONE_OPTIONAL, message = "Phone number is not valid")
            String contactPhone,

            @Size(max = 300, message = "Note must be at most 300 characters")
            @Pattern(regexp = ValidationPatterns.SAFE_TEXT, message = "Note must not contain < or >")
            String note
    ) {
    }

    public record UpdateStatusRequest(
            @NotNull(message = "Choose a status")
            OrderStatus status
    ) {
    }

    public record OrderItemDto(Long menuItemId, String name, BigDecimal unitPrice, int quantity, BigDecimal lineTotal) {
        static OrderItemDto from(OrderItem item) {
            return new OrderItemDto(item.getMenuItemId(), item.getName(), item.getUnitPrice(), item.getQuantity(),
                    item.getLineTotal());
        }
    }

    public record OrderRestaurantDto(Long id, String name, String phone, String logoUrl) {
        static OrderRestaurantDto from(Restaurant r) {
            String logoUrl = r.getLogoVersion() == null
                    ? null
                    : "/api/restaurants/" + r.getId() + "/logo?v=" + r.getLogoVersion();
            return new OrderRestaurantDto(r.getId(), r.getName(), r.getPhone(), logoUrl);
        }
    }

    public record OrderDto(
            Long id,
            OrderStatus status,
            ServiceOption serviceOption,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            String currency,
            BigDecimal total,
            String deliveryAddress,
            String contactPhone,
            String note,
            Instant createdAt,
            Instant updatedAt,
            OrderRestaurantDto restaurant,
            String customerEmail,
            List<OrderItemDto> items,
            List<OrderStatus> nextStatuses,
            boolean cancellable
    ) {
        static OrderDto from(Order o) {
            return new OrderDto(o.getId(), o.getStatus(), o.getServiceOption(), o.getPaymentMethod(),
                    o.getPaymentStatus(), o.getCurrency(), o.getTotal(), o.getDeliveryAddress(), o.getContactPhone(),
                    o.getNote(), o.getCreatedAt(), o.getUpdatedAt(), OrderRestaurantDto.from(o.getRestaurant()),
                    o.getCustomer().getEmail(), o.getItems().stream().map(OrderItemDto::from).toList(),
                    o.getStatus().nextForRestaurant(o.getServiceOption()), o.getStatus().cancellableByCustomer());
        }
    }
}

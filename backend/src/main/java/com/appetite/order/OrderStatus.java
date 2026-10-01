package com.appetite.order;

import com.appetite.restaurant.ServiceOption;

import java.util.List;

public enum OrderStatus {
    PLACED,
    ACCEPTED,
    PREPARING,
    READY,
    OUT_FOR_DELIVERY,
    COMPLETED,
    CANCELLED;

    /** Statuses the restaurant can move an order to from this one. */
    public List<OrderStatus> nextForRestaurant(ServiceOption service) {
        return switch (this) {
            case PLACED -> List.of(ACCEPTED, CANCELLED);
            case ACCEPTED -> List.of(PREPARING, CANCELLED);
            case PREPARING -> List.of(READY);
            case READY -> service == ServiceOption.DELIVERY ? List.of(OUT_FOR_DELIVERY) : List.of(COMPLETED);
            case OUT_FOR_DELIVERY -> List.of(COMPLETED);
            case COMPLETED, CANCELLED -> List.of();
        };
    }

    /** Clients can only cancel before the restaurant has accepted the order. */
    public boolean cancellableByCustomer() {
        return this == PLACED;
    }

    public boolean isActive() {
        return this != COMPLETED && this != CANCELLED;
    }
}

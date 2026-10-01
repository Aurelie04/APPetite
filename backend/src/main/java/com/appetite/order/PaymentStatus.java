package com.appetite.order;

public enum PaymentStatus {
    /** Cash on arrival: collected when the order is delivered or picked up. */
    PENDING,
    PAID,
    /** An online payment for an order that was cancelled. */
    REFUNDED
}

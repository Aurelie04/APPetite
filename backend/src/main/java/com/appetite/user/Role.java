package com.appetite.user;

public enum Role {
    /** Client ordering food through the app. */
    CUSTOMER,
    /** Admin of a restaurant registered on the platform. */
    RESTAURANT,
    /** Platform support staff; cannot be self-registered. */
    ADMIN
}

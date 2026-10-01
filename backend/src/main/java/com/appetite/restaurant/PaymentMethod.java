package com.appetite.restaurant;

public enum PaymentMethod {
    CASH_ON_ARRIVAL(false),
    CARD_ONLINE(true),
    MOBILE_MONEY(true),
    PAYPAL(true);

    private final boolean online;

    PaymentMethod(boolean online) {
        this.online = online;
    }

    /** Online methods are paid at checkout; cash is collected when the order is handed over. */
    public boolean isOnline() {
        return online;
    }
}

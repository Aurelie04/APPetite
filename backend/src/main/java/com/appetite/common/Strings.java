package com.appetite.common;

public final class Strings {

    private Strings() {
    }

    public static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

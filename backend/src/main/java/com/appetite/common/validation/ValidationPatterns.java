package com.appetite.common.validation;

/** Regular expressions shared by request DTOs. Keep in sync with frontend/src/utils/validation.js. */
public final class ValidationPatterns {

    /** Requires a dotted domain with a 2+ letter TLD (stricter than the default @Email). */
    public static final String EMAIL = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$";

    /** Person name: starts with a letter, then letters (incl. accents), spaces, apostrophes, dots or hyphens. */
    public static final String PERSON_NAME = "^\\p{L}[\\p{L} '.-]{1,99}$";

    /** Restaurant name: starts with a letter or digit, then letters, digits, spaces and & ' . , ! - */
    public static final String RESTAURANT_NAME = "^[\\p{L}\\p{N}][\\p{L}\\p{N} '&.,!-]{1,119}$";

    public static final String PHONE_OPTIONAL = "^$|^[+0-9 ()-]{6,20}$";

    private ValidationPatterns() {
    }
}

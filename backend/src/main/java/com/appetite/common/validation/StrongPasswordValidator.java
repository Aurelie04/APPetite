package com.appetite.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.ArrayList;
import java.util.List;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    static final int MIN_LENGTH = 8;
    static final int MAX_LENGTH = 100;

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return fail(context, "Password is required");
        }
        if (password.length() > MAX_LENGTH) {
            return fail(context, "Password must be at most " + MAX_LENGTH + " characters");
        }
        if (password.chars().anyMatch(Character::isWhitespace)) {
            return fail(context, "Password must not contain spaces");
        }

        List<String> missing = new ArrayList<>();
        if (password.length() < MIN_LENGTH) missing.add("at least " + MIN_LENGTH + " characters");
        if (password.chars().noneMatch(Character::isUpperCase)) missing.add("an uppercase letter");
        if (password.chars().noneMatch(Character::isLowerCase)) missing.add("a lowercase letter");
        if (password.chars().noneMatch(Character::isDigit)) missing.add("a number");
        if (password.chars().allMatch(Character::isLetterOrDigit)) missing.add("a special character");

        return missing.isEmpty() || fail(context, "Password must contain " + joinReadable(missing));
    }

    private static String joinReadable(List<String> items) {
        if (items.size() == 1) return items.get(0);
        return String.join(", ", items.subList(0, items.size() - 1)) + " and " + items.get(items.size() - 1);
    }

    private static boolean fail(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }
}

package com.appetite.auth.dto;

import com.appetite.common.validation.StrongPassword;
import com.appetite.common.validation.ValidationPatterns;
import com.appetite.user.UserDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private static final String EMAIL_INVALID = "Please enter a valid email address (e.g. name@example.com)";

    private AuthDtos() {
    }

    public record ClientRegisterRequest(
            @NotBlank(message = "Email is required")
            @Email(regexp = ValidationPatterns.EMAIL, message = EMAIL_INVALID)
            @Size(max = 150, message = "Email must be at most 150 characters")
            String email,

            @StrongPassword
            String password
    ) {
    }

    public record RestaurantRegisterRequest(
            @NotBlank(message = "Your name is required")
            @Pattern(regexp = ValidationPatterns.PERSON_NAME,
                    message = "Your name must be 2-100 characters and contain only letters, spaces, apostrophes or hyphens")
            String fullName,

            @NotBlank(message = "Restaurant name is required")
            @Pattern(regexp = ValidationPatterns.RESTAURANT_NAME,
                    message = "Restaurant name must be 2-120 characters (letters, numbers, spaces and & ' . , ! -)")
            String restaurantName,

            @NotBlank(message = "Email is required")
            @Email(regexp = ValidationPatterns.EMAIL, message = EMAIL_INVALID)
            @Size(max = 150, message = "Email must be at most 150 characters")
            String email,

            @StrongPassword
            String password
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(regexp = ValidationPatterns.EMAIL, message = EMAIL_INVALID)
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required")
            @Email(regexp = ValidationPatterns.EMAIL, message = EMAIL_INVALID)
            String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Reset token is required")
            String token,

            @StrongPassword
            String password
    ) {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    public record MessageResponse(String message, String resetUrl) {

        public MessageResponse(String message) {
            this(message, null);
        }
    }
}

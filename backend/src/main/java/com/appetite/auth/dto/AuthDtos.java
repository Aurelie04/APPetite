package com.appetite.auth.dto;

import com.appetite.user.UserDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record ClientRegisterRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email is not valid")
            @Size(max = 150, message = "Email must be at most 150 characters")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
            String password
    ) {
    }

    public record RestaurantRegisterRequest(
            @NotBlank(message = "Your name is required")
            @Size(max = 100, message = "Your name must be at most 100 characters")
            String fullName,

            @NotBlank(message = "Restaurant name is required")
            @Size(max = 120, message = "Restaurant name must be at most 120 characters")
            String restaurantName,

            @NotBlank(message = "Email is required")
            @Email(message = "Email is not valid")
            @Size(max = 150, message = "Email must be at most 150 characters")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
            String password
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email is not valid")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email is not valid")
            String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Reset token is required")
            String token,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
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

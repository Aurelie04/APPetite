package com.appetite.auth;

import com.appetite.auth.dto.AuthDtos.AuthResponse;
import com.appetite.auth.dto.AuthDtos.ClientRegisterRequest;
import com.appetite.auth.dto.AuthDtos.ForgotPasswordRequest;
import com.appetite.auth.dto.AuthDtos.LoginRequest;
import com.appetite.auth.dto.AuthDtos.MessageResponse;
import com.appetite.auth.dto.AuthDtos.ResetPasswordRequest;
import com.appetite.auth.dto.AuthDtos.RestaurantRegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/client")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerClient(@Valid @RequestBody ClientRegisterRequest request) {
        return authService.registerClient(request);
    }

    @PostMapping("/register/restaurant")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerRestaurant(@Valid @RequestBody RestaurantRegisterRequest request) {
        return authService.registerRestaurant(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
}

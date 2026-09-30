package com.appetite.auth;

import com.appetite.auth.dto.AuthDtos.AuthResponse;
import com.appetite.auth.dto.AuthDtos.ClientRegisterRequest;
import com.appetite.auth.dto.AuthDtos.ForgotPasswordRequest;
import com.appetite.auth.dto.AuthDtos.LoginRequest;
import com.appetite.auth.dto.AuthDtos.MessageResponse;
import com.appetite.auth.dto.AuthDtos.ResetPasswordRequest;
import com.appetite.auth.dto.AuthDtos.RestaurantRegisterRequest;
import com.appetite.common.ApiException;
import com.appetite.restaurant.Restaurant;
import com.appetite.restaurant.RestaurantRepository;
import com.appetite.security.JwtService;
import com.appetite.security.LoginAttemptService;
import com.appetite.user.Role;
import com.appetite.user.User;
import com.appetite.user.UserDto;
import com.appetite.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String FORGOT_PASSWORD_MESSAGE =
            "If an account exists for this email, a password reset link has been sent.";

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final LoginAttemptService loginAttemptService;
    private final JwtService jwtService;
    private final SecureRandom secureRandom = new SecureRandom();

    private final String frontendUrl;
    private final Duration resetTokenTtl;
    private final boolean exposeResetLink;

    public AuthService(UserRepository userRepository,
                       RestaurantRepository restaurantRepository,
                       PasswordResetTokenRepository resetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       LoginAttemptService loginAttemptService,
                       JwtService jwtService,
                       @Value("${app.frontend-url}") String frontendUrl,
                       @Value("${app.password-reset.expiration-minutes}") long resetTokenMinutes,
                       @Value("${app.password-reset.expose-link}") boolean exposeResetLink) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.loginAttemptService = loginAttemptService;
        this.jwtService = jwtService;
        this.frontendUrl = frontendUrl;
        this.resetTokenTtl = Duration.ofMinutes(resetTokenMinutes);
        this.exposeResetLink = exposeResetLink;
    }

    @Transactional
    public AuthResponse registerClient(ClientRegisterRequest request) {
        User user = createUser(request.email(), request.password(), Role.CUSTOMER, null);
        return toAuthResponse(user);
    }

    @Transactional
    public AuthResponse registerRestaurant(RestaurantRegisterRequest request) {
        User owner = createUser(request.email(), request.password(), Role.RESTAURANT, request.fullName().trim());
        restaurantRepository.save(new Restaurant(request.restaurantName().trim(), owner));
        return toAuthResponse(owner);
    }

    private User createUser(String rawEmail, String rawPassword, Role role, String fullName) {
        String email = normalizeEmail(rawEmail);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        loginAttemptService.ensureNotBlocked(email);
        try {
            authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
        } catch (AuthenticationException ex) {
            loginAttemptService.recordFailure(email);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        loginAttemptService.recordSuccess(email);

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return toAuthResponse(user);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        Optional<User> user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()));
        if (user.isEmpty()) {
            return new MessageResponse(FORGOT_PASSWORD_MESSAGE);
        }

        PasswordResetToken token = new PasswordResetToken(generateToken(), user.get(), Instant.now().plus(resetTokenTtl));
        resetTokenRepository.save(token);

        String resetUrl = frontendUrl + "/reset-password?token=" + token.getToken();
        log.info("Password reset link for {}: {}", user.get().getEmail(), resetUrl);

        return new MessageResponse(FORGOT_PASSWORD_MESSAGE, exposeResetLink ? resetUrl : null);
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = resetTokenRepository.findByToken(request.token())
                .filter(PasswordResetToken::isUsable)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "This reset link is invalid or has expired"));

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        token.markUsed();
        loginAttemptService.recordSuccess(user.getEmail());

        return new MessageResponse("Your password has been updated. You can now sign in.");
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), UserDto.from(user));
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}

package com.appetite.security;

import com.appetite.common.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Brute-force protection: after too many failed sign-ins for an email, further attempts are
 * refused for a cooldown period. State is in memory, so it resets when the backend restarts
 * and is not shared between multiple instances.
 */
@Service
public class LoginAttemptService {

    private static final int PRUNE_THRESHOLD = 10_000;

    private final int maxAttempts;
    private final Duration lockDuration;
    private final Clock clock;
    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    @Autowired
    public LoginAttemptService(@Value("${app.security.login.max-attempts:5}") int maxAttempts,
                               @Value("${app.security.login.lock-minutes:15}") long lockMinutes) {
        this(maxAttempts, Duration.ofMinutes(lockMinutes), Clock.systemUTC());
    }

    LoginAttemptService(int maxAttempts, Duration lockDuration, Clock clock) {
        this.maxAttempts = maxAttempts;
        this.lockDuration = lockDuration;
        this.clock = clock;
    }

    public void ensureNotBlocked(String email) {
        Attempts entry = attempts.get(email);
        if (entry != null && entry.lockedUntil != null && clock.instant().isBefore(entry.lockedUntil)) {
            long seconds = Duration.between(clock.instant(), entry.lockedUntil).toSeconds();
            long minutes = Math.max(1, (seconds + 59) / 60);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed sign-in attempts. Please try again in " + minutes + " minute" + (minutes == 1 ? "" : "s") + ".");
        }
    }

    public void recordFailure(String email) {
        Instant now = clock.instant();
        if (attempts.size() > PRUNE_THRESHOLD) {
            attempts.values().removeIf(a -> a.isStale(now, lockDuration));
        }
        attempts.compute(email, (key, current) -> {
            Attempts next = current == null || current.isStale(now, lockDuration) ? new Attempts() : current;
            next.failures++;
            next.lastFailure = now;
            if (next.failures >= maxAttempts) {
                next.lockedUntil = now.plus(lockDuration);
                next.failures = 0;
            }
            return next;
        });
    }

    public void recordSuccess(String email) {
        attempts.remove(email);
    }

    private static final class Attempts {
        int failures;
        Instant lastFailure;
        Instant lockedUntil;

        boolean isStale(Instant now, Duration window) {
            boolean lockExpired = lockedUntil == null || !now.isBefore(lockedUntil);
            boolean failuresExpired = lastFailure == null || now.isAfter(lastFailure.plus(window));
            return lockExpired && failuresExpired;
        }
    }
}

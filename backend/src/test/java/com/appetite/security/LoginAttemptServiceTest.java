package com.appetite.security;

import com.appetite.common.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginAttemptServiceTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-01-01T10:00:00Z"));
    private final LoginAttemptService service = new LoginAttemptService(3, Duration.ofMinutes(15), clock);

    @Test
    void locksAfterMaxFailuresAndUnlocksAfterCooldown() {
        service.recordFailure("a@example.com");
        service.recordFailure("a@example.com");
        assertThatCode(() -> service.ensureNotBlocked("a@example.com")).doesNotThrowAnyException();

        service.recordFailure("a@example.com");
        assertThatThrownBy(() -> service.ensureNotBlocked("a@example.com"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Too many failed sign-in attempts. Please try again in 15 minutes.")
                .extracting("status").isEqualTo(HttpStatus.TOO_MANY_REQUESTS);

        assertThatCode(() -> service.ensureNotBlocked("b@example.com")).doesNotThrowAnyException();

        clock.advance(Duration.ofMinutes(14).plusSeconds(30));
        assertThatThrownBy(() -> service.ensureNotBlocked("a@example.com"))
                .hasMessage("Too many failed sign-in attempts. Please try again in 1 minute.");

        clock.advance(Duration.ofSeconds(30));
        assertThatCode(() -> service.ensureNotBlocked("a@example.com")).doesNotThrowAnyException();
    }

    @Test
    void successfulLoginResetsTheFailureCount() {
        service.recordFailure("a@example.com");
        service.recordFailure("a@example.com");
        service.recordSuccess("a@example.com");
        service.recordFailure("a@example.com");
        service.recordFailure("a@example.com");

        assertThatCode(() -> service.ensureNotBlocked("a@example.com")).doesNotThrowAnyException();
    }

    @Test
    void oldFailuresExpire() {
        service.recordFailure("a@example.com");
        service.recordFailure("a@example.com");
        clock.advance(Duration.ofMinutes(16));
        service.recordFailure("a@example.com");

        assertThatCode(() -> service.ensureNotBlocked("a@example.com")).doesNotThrowAnyException();
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}

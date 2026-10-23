package com._pearls.contactApp.Util;

import com._pearls.contactApp.ExceptionHandling.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RateLimiterTest {

    /** A clock the test can move forward. */
    private static final class TestClock extends Clock {
        private Instant now = Instant.parse("2026-10-23T12:00:00Z");

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }
    }

    private final TestClock clock = new TestClock();
    private final RateLimiter limiter = new RateLimiter(clock);

    @Test
    void allowsUpToTheLimit_thenBlocksWithRetryAfter() {
        for (int i = 0; i < 3; i++) {
            limiter.check("key", 3, Duration.ofMinutes(1), "slow down");
        }
        clock.advance(Duration.ofSeconds(20));

        assertThatThrownBy(() -> limiter.check("key", 3, Duration.ofMinutes(1), "slow down"))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessage("slow down")
                .satisfies(ex -> assertThat(((TooManyRequestsException) ex).getRetryAfterSeconds()).isEqualTo(40));
    }

    @Test
    void countStartsAgainOnceTheWindowEnds() {
        for (int i = 0; i < 3; i++) {
            limiter.check("key", 3, Duration.ofMinutes(1), "slow down");
        }
        clock.advance(Duration.ofMinutes(1));

        assertThatCode(() -> limiter.check("key", 3, Duration.ofMinutes(1), "slow down")).doesNotThrowAnyException();
    }

    @Test
    void keysAreCountedSeparately() {
        limiter.check("a", 1, Duration.ofMinutes(1), "slow down");

        assertThatCode(() -> limiter.check("b", 1, Duration.ofMinutes(1), "slow down")).doesNotThrowAnyException();
        assertThatThrownBy(() -> limiter.check("a", 1, Duration.ofMinutes(1), "slow down"))
                .isInstanceOf(TooManyRequestsException.class);
    }
}

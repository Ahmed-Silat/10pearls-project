package com._pearls.contactApp.Util;

import com._pearls.contactApp.ExceptionHandling.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Counts attempts per key (e.g. "login:ali@example.com" or "ip:203.0.113.7:/user/login") in fixed time windows.
 * Counts live in memory: they reset when the app restarts and are not shared between instances, which is enough
 * to stop brute force against a single server.
 */
@Component
public class RateLimiter {

    /** Expired windows are swept out every this many calls, so the map can't grow without bound. */
    private static final int CLEANUP_EVERY = 1_000;

    private record Window(Instant start, Duration length, int count) {
        Instant end() {
            return start.plus(length);
        }
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicInteger callsSinceCleanup = new AtomicInteger();
    private final Clock clock;

    public RateLimiter() {
        this(Clock.systemUTC());
    }

    RateLimiter(Clock clock) {
        this.clock = clock;
    }

    /**
     * Records one attempt for {@code key}. Throws once more than {@code limit} attempts have been made within
     * {@code window}; the count starts again when the window ends.
     */
    public void check(String key, int limit, Duration window, String message) {
        Instant now = clock.instant();
        Window current = windows.compute(key, (k, old) ->
                old == null || !now.isBefore(old.end())
                        ? new Window(now, window, 1)
                        : new Window(old.start(), old.length(), old.count() + 1));
        cleanUpOccasionally(now);
        if (current.count() > limit) {
            long retryAfter = Math.max(1, Duration.between(now, current.end()).toSeconds());
            throw new TooManyRequestsException(message, retryAfter);
        }
    }

    private void cleanUpOccasionally(Instant now) {
        if (callsSinceCleanup.incrementAndGet() >= CLEANUP_EVERY) {
            callsSinceCleanup.set(0);
            windows.values().removeIf(w -> !now.isBefore(w.end()));
        }
    }
}

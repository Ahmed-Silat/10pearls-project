package com._pearls.contactApp.Config;

import com._pearls.contactApp.ExceptionHandling.TooManyRequestsException;
import com._pearls.contactApp.Util.RateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

/**
 * Per-IP limits on the public auth endpoints, so one client can't brute-force passwords or reset codes, or
 * flood people with reset emails, and on contact imports, which are heavy. Per-account limits live in the
 * services.
 *
 * <p>Uses the connection's address. If the app is deployed behind a proxy or load balancer, set
 * {@code server.forward-headers-strategy=native} so this sees the real client IP instead of the proxy's.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private record Limit(int requests, Duration window) {
    }

    private static final Map<String, Limit> LIMITS = Map.of(
            "/user/login", new Limit(10, Duration.ofMinutes(1)),
            "/user/signup", new Limit(10, Duration.ofHours(1)),
            "/user/forgot-password", new Limit(5, Duration.ofMinutes(15)),
            "/user/verify-otp", new Limit(10, Duration.ofMinutes(15)),
            "/user/reset-password", new Limit(10, Duration.ofMinutes(15)),
            // Each import is usually two requests (the preview, then the import itself).
            "/contact/import", new Limit(30, Duration.ofHours(1)));

    static final String MESSAGE = "Too many attempts. Please wait a few minutes and try again.";

    private final RateLimiter rateLimiter;

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        Limit limit = "POST".equals(request.getMethod()) ? LIMITS.get(path) : null;
        if (enabled && limit != null) {
            try {
                String key = "ip:" + request.getRemoteAddr() + ":" + path;
                rateLimiter.check(key, limit.requests(), limit.window(), MESSAGE);
            } catch (TooManyRequestsException ex) {
                log.warn("Rate limit hit for {} on {}", request.getRemoteAddr(), path);
                writeTooManyRequests(response, ex);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    /** Same body shape as GlobalExceptionHandler's errors, so the frontend reads the message the same way. */
    private static void writeTooManyRequests(HttpServletResponse response, TooManyRequestsException ex)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"timestamp\":" + System.currentTimeMillis()
                + ",\"status\":429,\"message\":\"" + MESSAGE + "\"}");
    }
}

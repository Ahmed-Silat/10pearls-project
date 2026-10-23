package com._pearls.contactApp.Config;

import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.UserRepo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepo userRepo;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            jwtService.verify(token).ifPresent(verified ->
                    userRepo.findById(verified.userId())
                            .filter(user -> !issuedBeforePasswordChange(verified.issuedAt(), user))
                            .ifPresent(user -> {
                                AuthUser authUser = new AuthUser(user);
                                UsernamePasswordAuthenticationToken authentication =
                                        new UsernamePasswordAuthenticationToken(authUser, null, authUser.getAuthorities());
                                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                                SecurityContextHolder.getContext().setAuthentication(authentication);
                            }));
        }
        filterChain.doFilter(request, response);
    }

    /**
     * A token from before the last password change belongs to an old session, so it is rejected. Token issue
     * times only have whole seconds, so the change time is rounded down to match; otherwise the fresh token
     * handed out by the password change itself would be rejected too.
     */
    static boolean issuedBeforePasswordChange(Instant issuedAt, User user) {
        Instant changedAt = user.getPasswordChangedAt();
        return changedAt != null && issuedAt.isBefore(changedAt.truncatedTo(ChronoUnit.SECONDS));
    }
}
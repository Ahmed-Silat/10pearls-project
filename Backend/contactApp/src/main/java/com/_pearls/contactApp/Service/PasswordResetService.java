package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.VerifyOtpResponse;
import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.Model.PasswordResetOtp;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.PasswordResetOtpRepo;
import com._pearls.contactApp.Repo.UserRepo;
import com._pearls.contactApp.Util.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import static com._pearls.contactApp.Util.TextUtils.normalize;

/**
 * Forgot-password flow: email a one-time code, verify it, then allow exactly one password reset.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PasswordResetService {

    static final String INVALID_CODE = "The code is invalid or has expired";
    static final String TOO_MANY_ATTEMPTS = "Too many incorrect attempts. Please request a new code.";
    static final String INVALID_RESET = "Your reset session has expired. Please start again.";
    static final String TOO_MANY_CODES = "Too many reset codes requested for this email. Please try again tomorrow.";

    /** Codes per email per day. With 5 guesses per code, that's at most 50 guesses a day at a 1-in-a-million code. */
    static final int MAX_CODES_PER_DAY = 10;

    private final SecureRandom random = new SecureRandom();

    private final UserRepo userRepo;
    private final PasswordResetOtpRepo otpRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RateLimiter rateLimiter;

    private volatile String dummyHash;

    @Value("${app.password-reset.otp-expiry-minutes:10}")
    private long otpExpiryMinutes;

    @Value("${app.password-reset.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.password-reset.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    @Value("${app.password-reset.reset-token-expiry-minutes:10}")
    private long resetTokenExpiryMinutes;

    /**
     * Emails a new code if the address belongs to a user. Returns normally either way, so callers
     * cannot use this endpoint to find out which emails have accounts.
     */
    @Transactional
    public void requestOtp(String rawEmail) {
        String email = normalize(rawEmail);
        // Counted per email whether or not it has an account, so hitting the limit reveals nothing.
        rateLimiter.check("forgot-password:" + email, MAX_CODES_PER_DAY, Duration.ofDays(1), TOO_MANY_CODES);

        // Hash a code on every path, even when nothing will be sent. Hashing is the slow step, and skipping it
        // for unknown emails would let the response time reveal which emails have accounts.
        String otp = String.format("%06d", random.nextInt(1_000_000));
        String otpHash = passwordEncoder.encode(otp);

        Optional<User> userOpt = userRepo.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for an email with no account");
            return;
        }
        User user = userOpt.get();
        Instant now = Instant.now();

        Optional<PasswordResetOtp> existing = otpRepo.findByUser_Id(user.getId());
        if (existing.isPresent() && existing.get().getOtpHash() != null
                && existing.get().getCreatedAt().isAfter(now.minusSeconds(resendCooldownSeconds))) {
            log.info("Password reset code requested again within the cooldown for user {}", user.getId());
            return;
        }

        otpRepo.deleteByUserId(user.getId());
        otpRepo.save(PasswordResetOtp.builder()
                .user(user)
                .otpHash(otpHash)
                .otpExpiresAt(now.plus(otpExpiryMinutes, ChronoUnit.MINUTES))
                .failedAttempts(0)
                .createdAt(now)
                .build());

        emailService.sendPasswordResetOtp(user.getEmail(), user.getFirstName(), otp);
    }

    /**
     * Checks the code. On success the code is used up and a one-time reset token is returned.
     * Failed attempts are saved even though an exception is thrown, hence {@code noRollbackFor}.
     */
    @Transactional(noRollbackFor = BadRequestException.class)
    public VerifyOtpResponse verifyOtp(String rawEmail, String otp) {
        // Locked, so parallel guesses queue up instead of all reading the same attempt count.
        Instant now = Instant.now();
        PasswordResetOtp entry = findEntryForUpdate(rawEmail)
                .filter(e -> e.getOtpHash() != null && !e.getOtpExpiresAt().isBefore(now))
                .orElse(null);

        // Always run one hash check, so a missing or expired code takes as long to reject as a wrong one.
        boolean codeMatches = passwordEncoder.matches(otp, entry != null ? entry.getOtpHash() : dummyHash());
        if (entry == null) {
            throw new BadRequestException(INVALID_CODE);
        }
        if (entry.getFailedAttempts() >= maxAttempts) {
            throw new BadRequestException(TOO_MANY_ATTEMPTS);
        }
        if (!codeMatches) {
            entry.setFailedAttempts(entry.getFailedAttempts() + 1);
            otpRepo.save(entry);
            throw new BadRequestException(entry.getFailedAttempts() >= maxAttempts ? TOO_MANY_ATTEMPTS : INVALID_CODE);
        }

        byte[] tokenBytes = new byte[32];
        random.nextBytes(tokenBytes);
        String resetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        entry.setOtpHash(null);
        entry.setResetTokenHash(sha256(resetToken));
        entry.setResetTokenExpiresAt(now.plus(resetTokenExpiryMinutes, ChronoUnit.MINUTES));
        otpRepo.save(entry);
        return new VerifyOtpResponse(resetToken);
    }

    /** Sets the new password if the reset token is valid, then deletes the reset request. */
    @Transactional
    public void resetPassword(String rawEmail, String resetToken, String newPassword) {
        User user = userRepo.findByEmailIgnoreCase(normalize(rawEmail))
                .orElseThrow(() -> new BadRequestException(INVALID_RESET));
        PasswordResetOtp entry = otpRepo.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new BadRequestException(INVALID_RESET));

        boolean valid = entry.getResetTokenHash() != null
                && entry.getResetTokenExpiresAt() != null
                && entry.getResetTokenExpiresAt().isAfter(Instant.now())
                && MessageDigest.isEqual(
                        entry.getResetTokenHash().getBytes(StandardCharsets.UTF_8),
                        sha256(resetToken).getBytes(StandardCharsets.UTF_8));
        if (!valid) {
            throw new BadRequestException(INVALID_RESET);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        // Signs out every existing session, including one an attacker may have.
        user.setPasswordChangedAt(Instant.now());
        userRepo.save(user);
        otpRepo.delete(entry);
        log.info("Password reset completed for user {}", user.getId());
    }

    private Optional<PasswordResetOtp> findEntryForUpdate(String rawEmail) {
        return userRepo.findByEmailIgnoreCase(normalize(rawEmail))
                .flatMap(user -> otpRepo.findByUserIdForUpdate(user.getId()));
    }

    /** A real hash of a random value, checked against when there's no code, so that path isn't faster. */
    private String dummyHash() {
        if (dummyHash == null) {
            dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
        }
        return dummyHash;
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}

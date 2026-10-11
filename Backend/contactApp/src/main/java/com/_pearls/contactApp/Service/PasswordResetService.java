package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.VerifyOtpResponse;
import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.Model.PasswordResetOtp;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.PasswordResetOtpRepo;
import com._pearls.contactApp.Repo.UserRepo;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

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

    private final SecureRandom random = new SecureRandom();

    private final UserRepo userRepo;
    private final PasswordResetOtpRepo otpRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

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
        Optional<User> userOpt = userRepo.findByEmailIgnoreCase(normalize(rawEmail));
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

        String otp = String.format("%06d", random.nextInt(1_000_000));
        otpRepo.deleteByUserId(user.getId());
        otpRepo.save(PasswordResetOtp.builder()
                .user(user)
                .otpHash(passwordEncoder.encode(otp))
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
        PasswordResetOtp entry = findEntry(rawEmail)
                .orElseThrow(() -> new BadRequestException(INVALID_CODE));
        Instant now = Instant.now();

        if (entry.getOtpHash() == null || entry.getOtpExpiresAt().isBefore(now)) {
            throw new BadRequestException(INVALID_CODE);
        }
        if (entry.getFailedAttempts() >= maxAttempts) {
            throw new BadRequestException(TOO_MANY_ATTEMPTS);
        }
        if (!passwordEncoder.matches(otp, entry.getOtpHash())) {
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
        PasswordResetOtp entry = otpRepo.findByUser_Id(user.getId())
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
        userRepo.save(user);
        otpRepo.delete(entry);
        log.info("Password reset completed for user {}", user.getId());
    }

    private Optional<PasswordResetOtp> findEntry(String rawEmail) {
        return userRepo.findByEmailIgnoreCase(normalize(rawEmail))
                .flatMap(user -> otpRepo.findByUser_Id(user.getId()));
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

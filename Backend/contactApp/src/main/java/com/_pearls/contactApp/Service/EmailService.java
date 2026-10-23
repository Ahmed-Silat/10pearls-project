package com._pearls.contactApp.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.log-codes:false}")
    private boolean logCodes;

    @Value("${app.mail.from:no-reply@contactapp.local}")
    private String from;

    @Value("${app.password-reset.otp-expiry-minutes:10}")
    private long otpExpiryMinutes;

    /** Sends in the background so the API responds at the same speed whether or not the email exists. */
    @Async
    public void sendPasswordResetOtp(String to, String firstName, String otp) {
        if (!mailEnabled) {
            // Reset codes are as good as a password, so they only reach the log when explicitly asked for
            // (local development without an SMTP server).
            if (logCodes) {
                log.warn("MAIL_ENABLED is false - password reset code for {} is {}", to, otp);
            } else {
                log.warn("MAIL_ENABLED is false - password reset email to {} was not sent "
                        + "(set MAIL_LOG_CODES=true to log the code in local development)", to);
            }
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Your password reset code");
        message.setText("""
                Hi %s,

                Use this code to reset your Contact App password:

                    %s

                The code expires in %d minutes. If you did not ask to reset your password, you can ignore this email.
                """.formatted(firstName == null || firstName.isBlank() ? "there" : StringUtils.capitalize(firstName),
                otp, otpExpiryMinutes));

        try {
            mailSender.send(message);
            log.info("Password reset code sent to {}", to);
        } catch (MailException ex) {
            log.error("Failed to send password reset code to {}: {}", to, ex.getMessage());
        }
    }
}

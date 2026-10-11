package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Dto.ForgotPasswordRequest;
import com._pearls.contactApp.Dto.ResetPasswordRequest;
import com._pearls.contactApp.Dto.VerifyOtpRequest;
import com._pearls.contactApp.Dto.VerifyOtpResponse;
import com._pearls.contactApp.Service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public (no login required) endpoints for the forgot-password flow. */
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestOtp(request.getEmail());
        // Same response whether or not the email has an account.
        return Map.of("message", "If an account exists for this email, a reset code has been sent.");
    }

    @PostMapping("/verify-otp")
    public VerifyOtpResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return passwordResetService.verifyOtp(request.getEmail(), request.getOtp());
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getEmail(), request.getResetToken(), request.getNewPassword());
        return Map.of("message", "Password updated successfully. You can now log in.");
    }
}

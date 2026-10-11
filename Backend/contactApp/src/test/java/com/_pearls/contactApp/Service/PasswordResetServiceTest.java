package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.VerifyOtpResponse;
import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.Model.PasswordResetOtp;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.PasswordResetOtpRepo;
import com._pearls.contactApp.Repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private PasswordResetOtpRepo otpRepo;

    @Mock
    private EmailService emailService;

    // A real encoder (low cost for speed) so hashing and matching behave as in production.
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

    @InjectMocks
    private PasswordResetService service;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(service, "otpExpiryMinutes", 10L);
        ReflectionTestUtils.setField(service, "maxAttempts", 5);
        ReflectionTestUtils.setField(service, "resendCooldownSeconds", 60L);
        ReflectionTestUtils.setField(service, "resetTokenExpiryMinutes", 10L);

        user = User.builder()
                .id("user-1")
                .firstName("ahmed")
                .email("ahmed@example.com")
                .password("old-hash")
                .build();
    }

    private PasswordResetOtp pendingEntry(String otp, Instant createdAt) {
        return PasswordResetOtp.builder()
                .id("otp-1")
                .user(user)
                .otpHash(passwordEncoder.encode(otp))
                .otpExpiresAt(createdAt.plusSeconds(600))
                .failedAttempts(0)
                .createdAt(createdAt)
                .build();
    }

    @Test
    void requestOtp_unknownEmail_sendsNothing() {
        when(userRepo.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());

        service.requestOtp("  Ghost@Example.com ");

        verify(otpRepo, never()).save(any());
        verify(emailService, never()).sendPasswordResetOtp(anyString(), any(), anyString());
    }

    @Test
    void requestOtp_knownEmail_storesHashedCodeAndEmailsIt() {
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.empty());

        service.requestOtp("Ahmed@Example.com");

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetOtp(org.mockito.ArgumentMatchers.eq("ahmed@example.com"),
                org.mockito.ArgumentMatchers.eq("ahmed"), otpCaptor.capture());
        String otp = otpCaptor.getValue();
        assertThat(otp).matches("\\d{6}");

        ArgumentCaptor<PasswordResetOtp> saved = ArgumentCaptor.forClass(PasswordResetOtp.class);
        verify(otpRepo).deleteByUserId("user-1");
        verify(otpRepo).save(saved.capture());
        assertThat(saved.getValue().getOtpHash()).isNotEqualTo(otp);
        assertThat(passwordEncoder.matches(otp, saved.getValue().getOtpHash())).isTrue();
        assertThat(saved.getValue().getOtpExpiresAt()).isAfter(Instant.now().plusSeconds(590));
    }

    @Test
    void requestOtp_withinCooldown_doesNotSendAnotherCode() {
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(pendingEntry("123456", Instant.now().minusSeconds(10))));

        service.requestOtp("ahmed@example.com");

        verify(otpRepo, never()).save(any());
        verify(emailService, never()).sendPasswordResetOtp(anyString(), any(), anyString());
    }

    @Test
    void verifyOtp_correctCode_returnsTokenAndUsesUpCode() {
        PasswordResetOtp entry = pendingEntry("123456", Instant.now());
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(entry));

        VerifyOtpResponse response = service.verifyOtp("ahmed@example.com", "123456");

        assertThat(response.getResetToken()).isNotBlank();
        assertThat(entry.getOtpHash()).isNull();
        assertThat(entry.getResetTokenHash()).isNotEqualTo(response.getResetToken());

        // The same code cannot be used a second time.
        assertThatThrownBy(() -> service.verifyOtp("ahmed@example.com", "123456"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(PasswordResetService.INVALID_CODE);
    }

    @Test
    void verifyOtp_wrongCode_countsTheAttempt() {
        PasswordResetOtp entry = pendingEntry("123456", Instant.now());
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> service.verifyOtp("ahmed@example.com", "000000"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(PasswordResetService.INVALID_CODE);

        assertThat(entry.getFailedAttempts()).isEqualTo(1);
        verify(otpRepo).save(entry);
    }

    @Test
    void verifyOtp_afterMaxAttempts_rejectsEvenTheCorrectCode() {
        PasswordResetOtp entry = pendingEntry("123456", Instant.now());
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(entry));

        for (int i = 1; i <= 4; i++) {
            assertThatThrownBy(() -> service.verifyOtp("ahmed@example.com", "000000"))
                    .hasMessage(PasswordResetService.INVALID_CODE);
        }
        assertThatThrownBy(() -> service.verifyOtp("ahmed@example.com", "000000"))
                .hasMessage(PasswordResetService.TOO_MANY_ATTEMPTS);
        assertThatThrownBy(() -> service.verifyOtp("ahmed@example.com", "123456"))
                .hasMessage(PasswordResetService.TOO_MANY_ATTEMPTS);
        assertThat(entry.getResetTokenHash()).isNull();
    }

    @Test
    void verifyOtp_expiredCode_isRejected() {
        PasswordResetOtp entry = pendingEntry("123456", Instant.now().minusSeconds(1200));
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> service.verifyOtp("ahmed@example.com", "123456"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(PasswordResetService.INVALID_CODE);
    }

    @Test
    void verifyOtp_noPendingRequest_isRejected() {
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifyOtp("ahmed@example.com", "123456"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(PasswordResetService.INVALID_CODE);
    }

    @Test
    void resetPassword_withValidToken_updatesPasswordAndDeletesRequest() {
        PasswordResetOtp entry = pendingEntry("123456", Instant.now());
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(entry));
        String token = service.verifyOtp("ahmed@example.com", "123456").getResetToken();

        service.resetPassword("ahmed@example.com", token, "NewPassword123");

        assertThat(passwordEncoder.matches("NewPassword123", user.getPassword())).isTrue();
        verify(userRepo).save(user);
        verify(otpRepo).delete(entry);
    }

    @Test
    void resetPassword_withWrongToken_isRejected() {
        PasswordResetOtp entry = pendingEntry("123456", Instant.now());
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(entry));
        service.verifyOtp("ahmed@example.com", "123456");

        assertThatThrownBy(() -> service.resetPassword("ahmed@example.com", "not-the-token", "NewPassword123"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(PasswordResetService.INVALID_RESET);
        assertThat(user.getPassword()).isEqualTo("old-hash");
    }

    @Test
    void resetPassword_withExpiredToken_isRejected() {
        PasswordResetOtp entry = pendingEntry("123456", Instant.now());
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(entry));
        String token = service.verifyOtp("ahmed@example.com", "123456").getResetToken();
        entry.setResetTokenExpiresAt(Instant.now().minusSeconds(1));

        assertThatThrownBy(() -> service.resetPassword("ahmed@example.com", token, "NewPassword123"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(PasswordResetService.INVALID_RESET);
        assertThat(user.getPassword()).isEqualTo("old-hash");
    }

    @Test
    void resetPassword_withoutVerifyingCode_isRejected() {
        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(otpRepo.findByUser_Id("user-1")).thenReturn(Optional.of(pendingEntry("123456", Instant.now())));

        assertThatThrownBy(() -> service.resetPassword("ahmed@example.com", "anything", "NewPassword123"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(PasswordResetService.INVALID_RESET);
    }
}

package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Dto.VerifyOtpResponse;
import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.ExceptionHandling.GlobalExceptionHandler;
import com._pearls.contactApp.Service.PasswordResetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PasswordResetControllerTest {

    @Mock
    private PasswordResetService passwordResetService;

    @InjectMocks
    private PasswordResetController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void forgotPassword_returnsTheSameGenericMessage() throws Exception {
        mockMvc.perform(post("/user/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"anyone@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message",
                        is("If an account exists for this email, a reset code has been sent.")));

        verify(passwordResetService).requestOtp("anyone@example.com");
    }

    @Test
    void forgotPassword_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/user/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());

        verify(passwordResetService, never()).requestOtp(any());
    }

    @Test
    void verifyOtp_returnsResetToken() throws Exception {
        when(passwordResetService.verifyOtp("a@example.com", "123456")).thenReturn(new VerifyOtpResponse("tok"));

        mockMvc.perform(post("/user/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@example.com\",\"otp\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken", is("tok")));
    }

    @Test
    void verifyOtp_codeNotSixDigits_returns400() throws Exception {
        mockMvc.perform(post("/user/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@example.com\",\"otp\":\"12ab\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.otp").exists());
    }

    @Test
    void verifyOtp_wrongCode_returns400WithMessage() throws Exception {
        when(passwordResetService.verifyOtp("a@example.com", "000000"))
                .thenThrow(new BadRequestException("The code is invalid or has expired"));

        mockMvc.perform(post("/user/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@example.com\",\"otp\":\"000000\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("The code is invalid or has expired")));
    }

    @Test
    void resetPassword_shortPassword_returns400() throws Exception {
        mockMvc.perform(post("/user/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@example.com\",\"resetToken\":\"tok\",\"newPassword\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.newPassword").exists());

        verify(passwordResetService, never()).resetPassword(any(), any(), any());
    }
}

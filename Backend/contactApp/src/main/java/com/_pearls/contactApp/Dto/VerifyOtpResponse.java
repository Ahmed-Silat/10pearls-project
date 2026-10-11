package com._pearls.contactApp.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Returned after a correct OTP; the token authorises exactly one password reset. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpResponse {
    private String resetToken;
}

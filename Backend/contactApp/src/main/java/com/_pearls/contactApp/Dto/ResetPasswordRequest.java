package com._pearls.contactApp.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {

    @NotBlank(message = "email is required")
    @Email(message = "email must be a valid address")
    private String email;

    @NotBlank(message = "resetToken is required")
    private String resetToken;

    @NotBlank(message = "newPassword is required")
    @Size(min = 8, max = 72, message = "newPassword must be between 8 and 72 characters")
    private String newPassword;
}

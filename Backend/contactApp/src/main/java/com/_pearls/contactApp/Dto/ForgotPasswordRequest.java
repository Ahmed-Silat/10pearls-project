package com._pearls.contactApp.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordRequest {

    @NotBlank(message = "email is required")
    @Email(message = "email must be a valid address")
    @Size(max = 100, message = "email must be at most 100 characters")
    private String email;
}

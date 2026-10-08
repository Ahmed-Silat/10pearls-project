package com._pearls.contactApp.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {

    @NotBlank(message = "firstName is required")
    @Size(max = 50, message = "firstName must be at most 50 characters")
    private String firstName;

    @NotBlank(message = "lastName is required")
    @Size(max = 50, message = "lastName must be at most 50 characters")
    private String lastName;

    @NotBlank(message = "email is required")
    @Email(message = "email must be a valid address")
    @Size(max = 100, message = "email must be at most 100 characters")
    private String email;

    @NotBlank(message = "password is required")
    @Size(min = 8, max = 72, message = "password must be between 8 and 72 characters")
    private String password;

    @Size(max = 20, message = "phone must be at most 20 characters")
    private String phone;

    @Size(max = 255, message = "address must be at most 255 characters")
    private String address;
}
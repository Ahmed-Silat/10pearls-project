package com._pearls.contactApp.Dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Authentication response containing the JWT and the authenticated user's
 * profile.
 */
@Getter
@Setter
public class AuthResponse {
    private String token;
    private UserDto user;
}
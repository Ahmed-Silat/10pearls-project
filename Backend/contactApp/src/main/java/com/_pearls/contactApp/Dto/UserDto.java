package com._pearls.contactApp.Dto;

import lombok.Getter;
import lombok.Setter;

/** Public user representation - never exposes the password hash. */
@Getter
@Setter
public class UserDto {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String createdAt;
}
package com._pearls.contactApp.Dto;

import lombok.Getter;
import lombok.Setter;

/** Public contact representation returned by the API - never exposes the owning user entity. */
@Getter
@Setter
public class ContactDto {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
}

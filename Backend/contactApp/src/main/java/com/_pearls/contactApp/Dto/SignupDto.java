package com._pearls.contactApp.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupDto {

    private String id;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private String address;
}

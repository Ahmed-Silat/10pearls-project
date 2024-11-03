package com._pearls.contactApp.Dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordDto {

    public String currentPassword;
    public String newPassword;
}

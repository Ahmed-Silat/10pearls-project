package com._pearls.contactApp.Dto;

/** Another of the user's contacts that has the same phone number or email. {@code field} is "phone" or "email". */
public record DuplicateMatchDto(Long id, String firstName, String lastName, String field) {
}

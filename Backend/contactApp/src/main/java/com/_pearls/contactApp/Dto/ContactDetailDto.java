package com._pearls.contactApp.Dto;

/** An extra phone number or email on a contact: {@code {"label": "work", "value": "021 1234567"}}. */
public record ContactDetailDto(String label, String value) {
}

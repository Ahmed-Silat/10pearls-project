package com._pearls.contactApp.Dto;

/** A tag in the user's list, with how many of their (live) contacts have it. */
public record TagDto(Long id, String name, String color, long contactCount) {
}

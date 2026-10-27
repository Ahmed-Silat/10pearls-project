package com._pearls.contactApp.Dto;

/**
 * Something to tell the user about one contact in an imported file. {@code location} says where it is ("Row 5"
 * in a CSV, "Contact 5" in a vCard file), {@code name} who it is (as written in the file, may be empty).
 */
public record ImportIssueDto(String location, String name, String message) {
}

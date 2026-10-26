package com._pearls.contactApp.Dto;

/** How many contacts a bulk action changed (ids that were skipped don't count). */
public record BulkResultDto(long count) {
}

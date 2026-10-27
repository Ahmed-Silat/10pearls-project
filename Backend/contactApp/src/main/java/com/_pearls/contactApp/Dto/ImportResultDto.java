package com._pearls.contactApp.Dto;

import java.util.List;

/**
 * What an import did, or (with {@code dryRun}) would do.
 *
 * @param found      how many contacts the file has
 * @param imported   how many were (or would be) added
 * @param newTags    tags that don't exist yet and were (or would be) created
 * @param duplicates contacts left out because they match one the user already has, or an earlier one in the file
 *                   (empty when duplicates were allowed: they are then imported and counted in {@code imported})
 * @param problems   contacts that can't be imported, with the reason (e.g. no phone number)
 * @param warnings   contacts that were imported, but with something left out (e.g. a birthday with no year)
 */
public record ImportResultDto(boolean dryRun, int found, int imported, List<String> newTags,
                              List<ImportIssueDto> duplicates, List<ImportIssueDto> problems,
                              List<ImportIssueDto> warnings) {
}

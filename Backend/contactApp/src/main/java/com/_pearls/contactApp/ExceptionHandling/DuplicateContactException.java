package com._pearls.contactApp.ExceptionHandling;

import com._pearls.contactApp.Dto.DuplicateMatchDto;

import java.util.List;

/**
 * A contact would duplicate others the user already has. Returned as 409 with the matching contacts, so the
 * app can name them and offer to save anyway (by resending with {@code allowDuplicate}).
 */
public class DuplicateContactException extends DuplicateResourceException {

    private final List<DuplicateMatchDto> duplicates;

    public DuplicateContactException(String message, List<DuplicateMatchDto> duplicates) {
        super(message);
        this.duplicates = List.copyOf(duplicates);
    }

    public List<DuplicateMatchDto> getDuplicates() {
        return duplicates;
    }
}

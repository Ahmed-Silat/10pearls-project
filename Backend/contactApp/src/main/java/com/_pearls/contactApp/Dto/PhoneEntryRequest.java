package com._pearls.contactApp.Dto;

import com._pearls.contactApp.Model.ContactDetail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** An extra phone number in a contact request. A missing label is saved as "other". */
public record PhoneEntryRequest(
        @Pattern(regexp = ContactDetail.LABEL_PATTERN, message = "label must be mobile, work, home or other")
        String label,

        @NotBlank(message = "phone is required")
        @Size(max = 20, message = "phone must be at most 20 characters")
        String value) {
}

package com._pearls.contactApp.Dto;

import com._pearls.contactApp.Model.ContactDetail;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** An extra email in a contact request. A missing label is saved as "other". */
public record EmailEntryRequest(
        @Pattern(regexp = ContactDetail.LABEL_PATTERN, message = "label must be mobile, work, home or other")
        String label,

        @NotBlank(message = "email is required")
        @Email(message = "email must be a valid address")
        @Size(max = 100, message = "email must be at most 100 characters")
        String value) {
}

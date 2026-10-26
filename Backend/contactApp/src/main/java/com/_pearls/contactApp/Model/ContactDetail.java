package com._pearls.contactApp.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One extra phone number or email on a contact, with its label ("mobile", "work", "home" or "other"). */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ContactDetail {

    public static final String LABEL_OTHER = "other";

    /** The labels a phone number or email can have. Anything else is rejected by the request validation. */
    public static final String LABEL_PATTERN = "(?i)mobile|work|home|other";

    @Column(name = "label", nullable = false, length = 20)
    private String label;

    @Column(name = "value", nullable = false)
    private String value;
}

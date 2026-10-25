package com._pearls.contactApp.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ContactRequest {

    @NotBlank(message = "firstName is required")
    @Size(max = 50, message = "firstName must be at most 50 characters")
    private String firstName;

    @Size(max = 50, message = "lastName must be at most 50 characters")
    private String lastName;

    @Email(message = "email must be a valid address")
    @Size(max = 100, message = "email must be at most 100 characters")
    private String email;

    @NotBlank(message = "phone is required")
    @Size(max = 20, message = "phone must be at most 20 characters")
    private String phone;

    @Size(max = 255, message = "address must be at most 255 characters")
    private String address;

    /**
     * Whether this is an emergency contact. Optional: a new contact without it is not one, and an edit without it
     * keeps the current value, so older clients can't unmark a contact by accident.
     */
    private Boolean emergency;

    /** Save even if another contact has the same phone or email (the user chose "Save anyway"). */
    private boolean allowDuplicate;
}
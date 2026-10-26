package com._pearls.contactApp.Dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/** Public contact representation returned by the API - never exposes the owning user entity. */
@Getter
@Setter
public class ContactDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private boolean favorite;
    private boolean emergency;

    /** Sorted by name. */
    private List<TagSummaryDto> tags = List.of();

    /** Only for contacts in Recently deleted: when it was deleted, and when it will be deleted for good. */
    private String deletedAt;
    private String deletesPermanentlyAt;
}

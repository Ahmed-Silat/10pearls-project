package com._pearls.contactApp.Dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/** The contacts to move to Recently deleted in one go. */
@Getter
@Setter
public class BulkDeleteRequest {

    @NotEmpty(message = "ids is required")
    @Size(max = BulkTagRequest.MAX_IDS, message = "at most 500 contacts at a time")
    private List<@NotNull Long> ids;
}

package com._pearls.contactApp.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/** Adds a tag to, or removes it from, many contacts at once. {@code action} is ADD or REMOVE (any case). */
@Getter
@Setter
public class BulkTagRequest {

    /** Most contacts one bulk request may change. */
    public static final int MAX_IDS = 500;

    @NotEmpty(message = "ids is required")
    @Size(max = MAX_IDS, message = "at most 500 contacts at a time")
    private List<@NotNull Long> ids;

    @NotNull(message = "tagId is required")
    private Long tagId;

    @NotBlank(message = "action is required")
    @Pattern(regexp = "(?i)add|remove", message = "action must be ADD or REMOVE")
    private String action;

    public boolean isAdd() {
        return "add".equalsIgnoreCase(action);
    }
}

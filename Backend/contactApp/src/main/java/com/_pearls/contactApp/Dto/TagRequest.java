package com._pearls.contactApp.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Creates or renames a tag. */
@Getter
@Setter
public class TagRequest {

    /** The colours the frontend has styles for. */
    public static final String COLORS = "gray|red|orange|amber|green|teal|blue|violet|pink";

    @NotBlank(message = "name is required")
    @Size(max = 30, message = "name must be at most 30 characters")
    private String name;

    @NotBlank(message = "color is required")
    @Pattern(regexp = COLORS, message = "color must be one of: gray, red, orange, amber, green, teal, blue, violet, pink")
    private String color;
}

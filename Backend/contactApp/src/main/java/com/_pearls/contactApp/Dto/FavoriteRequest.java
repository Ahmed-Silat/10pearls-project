package com._pearls.contactApp.Dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Stars or unstars a contact. Sends the wanted state rather than "toggle", so a double click or a retried
 * request can't flip it back by accident.
 */
@Getter
@Setter
public class FavoriteRequest {

    @NotNull(message = "favorite is required")
    private Boolean favorite;
}

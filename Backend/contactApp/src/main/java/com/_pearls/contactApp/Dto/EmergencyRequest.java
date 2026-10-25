package com._pearls.contactApp.Dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Marks or unmarks a contact as an emergency contact. Sends the wanted state rather than "toggle", so a double
 * click or a retried request can't flip it back by accident.
 */
@Getter
@Setter
public class EmergencyRequest {

    @NotNull(message = "emergency is required")
    private Boolean emergency;
}

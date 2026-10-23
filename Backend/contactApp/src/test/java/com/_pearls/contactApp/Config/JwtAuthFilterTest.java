package com._pearls.contactApp.Config;

import com._pearls.contactApp.Model.User;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthFilterTest {

    private static User userWhosePasswordChangedAt(String instant) {
        return User.builder().id(1L).passwordChangedAt(instant == null ? null : Instant.parse(instant)).build();
    }

    @Test
    void tokenFromBeforeThePasswordChange_isRejected() {
        User user = userWhosePasswordChangedAt("2026-10-23T12:00:00.500Z");

        assertThat(JwtAuthFilter.issuedBeforePasswordChange(Instant.parse("2026-10-23T11:59:59Z"), user)).isTrue();
    }

    @Test
    void tokenIssuedRightAfterTheChange_inTheSameSecond_isAccepted() {
        // Token issue times are whole seconds, so the fresh token from the change reads as 12:00:00.
        User user = userWhosePasswordChangedAt("2026-10-23T12:00:00.500Z");

        assertThat(JwtAuthFilter.issuedBeforePasswordChange(Instant.parse("2026-10-23T12:00:00Z"), user)).isFalse();
    }

    @Test
    void passwordNeverChanged_acceptsAnyValidToken() {
        assertThat(JwtAuthFilter.issuedBeforePasswordChange(Instant.EPOCH, userWhosePasswordChangedAt(null))).isFalse();
    }
}

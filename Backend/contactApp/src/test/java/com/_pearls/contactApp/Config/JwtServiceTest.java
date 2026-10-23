package com._pearls.contactApp.Config;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final long ONE_HOUR_MS = 3_600_000L;

    private static String base64OfLength(int bytes) {
        return Base64.getEncoder().encodeToString(new byte[bytes]);
    }

    @Test
    void missingSecret_failsStartupWithHelpfulMessage() {
        assertThatThrownBy(() -> new JwtService("", ONE_HOUR_MS))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET is not set");
    }

    @Test
    void secretShorterThan256Bits_isRejected() {
        assertThatThrownBy(() -> new JwtService(base64OfLength(16), ONE_HOUR_MS))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    void nonBase64Secret_isRejected() {
        assertThatThrownBy(() -> new JwtService("not base64!!", ONE_HOUR_MS))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("base64");
    }

    @Test
    void validSecret_issuesTokensItCanVerify() {
        JwtService jwtService = new JwtService(base64OfLength(32), ONE_HOUR_MS);

        String token = jwtService.generateToken(7L, "ali@example.com");

        assertThat(jwtService.validateAndGetUserId(token)).contains(7L);
    }

    @Test
    void tokenSignedWithAnotherSecret_isRejected() {
        byte[] otherKey = new byte[32];
        otherKey[0] = 1;
        JwtService issuer = new JwtService(Base64.getEncoder().encodeToString(otherKey), ONE_HOUR_MS);
        JwtService verifier = new JwtService(base64OfLength(32), ONE_HOUR_MS);

        assertThat(verifier.validateAndGetUserId(issuer.generateToken(7L, "ali@example.com"))).isEmpty();
    }
}

package com._pearls.contactApp.Config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    private CorsConfiguration configFor(String origins) {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOrigins", origins);
        return corsConfig.corsConfigurationSource().getCorsConfiguration(new MockHttpServletRequest("GET", "/contact"));
    }

    @Test
    void spacesAroundOrigins_areIgnored() {
        CorsConfiguration config = configFor("http://localhost:3000, http://example.com ,");

        assertThat(config.getAllowedOrigins()).containsExactly("http://localhost:3000", "http://example.com");
        assertThat(config.checkOrigin("http://example.com")).isEqualTo("http://example.com");
    }
}

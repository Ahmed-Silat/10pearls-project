package com._pearls.contactApp.Config;

import com._pearls.contactApp.Util.RateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter(new RateLimiter());
        ReflectionTestUtils.setField(filter, "enabled", true);
    }

    private MockHttpServletResponse post(String path, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void eleventhLoginInAMinuteFromOneIp_gets429() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertThat(post("/user/login", "203.0.113.7").getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse blocked = post("/user/login", "203.0.113.7");

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isNotBlank();
        assertThat(blocked.getContentAsString()).contains(RateLimitFilter.MESSAGE);
    }

    @Test
    void otherIps_areNotAffected() throws Exception {
        for (int i = 0; i < 11; i++) {
            post("/user/login", "203.0.113.7");
        }

        assertThat(post("/user/login", "198.51.100.1").getStatus()).isEqualTo(200);
    }

    @Test
    void endpointsWithoutALimit_areNeverBlocked() throws Exception {
        for (int i = 0; i < 50; i++) {
            assertThat(post("/contact", "203.0.113.7").getStatus()).isEqualTo(200);
        }
    }
}

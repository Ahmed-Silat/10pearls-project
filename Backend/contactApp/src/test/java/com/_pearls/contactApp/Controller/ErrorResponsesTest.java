package com._pearls.contactApp.Controller;

import com._pearls.contactApp.ExceptionHandling.GlobalExceptionHandler;
import com._pearls.contactApp.Service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Client mistakes get the right 4xx status instead of a 500. */
@ExtendWith(MockitoExtension.class)
class ErrorResponsesTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void wrongHttpMethod_is405WithAllowHeader() throws Exception {
        mockMvc.perform(delete("/user/login"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", containsString("POST")))
                .andExpect(jsonPath("$.message", is("Method DELETE is not allowed on this endpoint")));
    }

    @Test
    void nonJsonBody_is415() throws Exception {
        mockMvc.perform(post("/user/login").contentType(MediaType.TEXT_PLAIN).content("email=a"))
                .andExpect(status().isUnsupportedMediaType());
    }
}

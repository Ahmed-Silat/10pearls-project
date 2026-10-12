package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.UserDto;
import com._pearls.contactApp.ExceptionHandling.GlobalExceptionHandler;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequestBuilder asUser(MockHttpServletRequestBuilder builder, Long userId) {
        User user = User.builder().id(userId).email("me@example.com").password("x").build();
        Authentication auth = new UsernamePasswordAuthenticationToken(new AuthUser(user), null, Collections.emptyList());
        return builder.with(request -> {
            SecurityContextHolder.getContext().setAuthentication(auth);
            return request;
        });
    }

    @Test
    void updateUser_returnsUpdatedDto() throws Exception {
        UserDto dto = new UserDto();
        dto.setId(1L);
        dto.setFirstName("Updated");
        dto.setLastName("Name");
        dto.setEmail("me@example.com");

        when(userService.updateUser(eq(1L), any())).thenReturn(dto);

        String body = """
                {"firstName":"Updated","lastName":"Name","email":"me@example.com",
                 "phone":"0300","address":"Karachi"}""";

        mockMvc.perform(asUser(put("/user/{id}", 1L), 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", org.hamcrest.Matchers.is(1)))
                .andExpect(jsonPath("$.firstName", org.hamcrest.Matchers.is("Updated")));
    }

    @Test
    void getUser_ownProfile_returnsDto() throws Exception {
        UserDto dto = new UserDto();
        dto.setId(1L);
        dto.setFirstName("ahmed");
        dto.setEmail("me@example.com");
        when(userService.getUser(1L)).thenReturn(dto);

        mockMvc.perform(asUser(get("/user/{id}", 1L), 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", org.hamcrest.Matchers.is(1)))
                .andExpect(jsonPath("$.firstName", org.hamcrest.Matchers.is("ahmed")))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void getUser_someoneElsesProfile_returns403() throws Exception {
        mockMvc.perform(asUser(get("/user/{id}", 2L), 1L))
                .andExpect(status().isForbidden());

        verify(userService, never()).getUser(any());
    }

    @Test
    void updateUser_someoneElsesProfile_returns403() throws Exception {
        String body = """
                {"firstName":"Updated","lastName":"Name","email":"me@example.com"}""";

        mockMvc.perform(asUser(put("/user/{id}", 2L), 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        verify(userService, never()).updateUser(any(), any());
    }

    @Test
    void changePassword_someoneElsesAccount_returns403() throws Exception {
        String body = """
                {"currentPassword":"OldPass@123","newPassword":"NewPass@123"}""";

        mockMvc.perform(asUser(put("/user/changePassword/{id}", 2L), 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        verify(userService, never()).changePassword(any(), any());
    }

    @Test
    void updateUser_blankBody_returns400() throws Exception {
        mockMvc.perform(asUser(put("/user/{id}", 1L), 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }
}
package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.TagDto;
import com._pearls.contactApp.ExceptionHandling.DuplicateResourceException;
import com._pearls.contactApp.ExceptionHandling.GlobalExceptionHandler;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Service.TagService;
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
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TagControllerTest {

    @Mock
    private TagService tagService;

    @InjectMocks
    private TagController tagController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tagController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /** Sets the authenticated principal for the upcoming request. */
    private MockHttpServletRequestBuilder asUser(MockHttpServletRequestBuilder builder, Long userId) {
        User user = User.builder().id(userId).email("me@example.com").password("x").build();
        Authentication auth = new UsernamePasswordAuthenticationToken(new AuthUser(user), null, Collections.emptyList());
        return builder.with(request -> {
            SecurityContextHolder.getContext().setAuthentication(auth);
            return request;
        });
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String body) {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    @Test
    void getTags_returnsTheSignedInUsersTags() throws Exception {
        when(tagService.getTags(1L)).thenReturn(List.of(new TagDto(2L, "Family", "green", 3)));

        mockMvc.perform(asUser(get("/tag"), 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(2)))
                .andExpect(jsonPath("$[0].name", is("Family")))
                .andExpect(jsonPath("$[0].color", is("green")))
                .andExpect(jsonPath("$[0].contactCount", is(3)));
    }

    @Test
    void createTag_returns201() throws Exception {
        when(tagService.createTag(eq(1L), argThat(r -> "Work".equals(r.getName()) && "blue".equals(r.getColor()))))
                .thenReturn(new TagDto(7L, "Work", "blue", 0));

        mockMvc.perform(asUser(json(post("/tag"), "{\"name\":\"Work\",\"color\":\"blue\"}"), 1L))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(7)));
    }

    @Test
    void createTag_withUnknownColour_returns400() throws Exception {
        mockMvc.perform(asUser(json(post("/tag"), "{\"name\":\"Work\",\"color\":\"purple\"}"), 1L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.color",
                        is("color must be one of: gray, red, orange, amber, green, teal, blue, violet, pink")));
        verify(tagService, never()).createTag(any(), any());
    }

    @Test
    void createTag_withoutName_returns400() throws Exception {
        mockMvc.perform(asUser(json(post("/tag"), "{\"name\":\"  \",\"color\":\"blue\"}"), 1L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name", is("name is required")));
    }

    @Test
    void createTag_withTooLongName_returns400() throws Exception {
        String name = "x".repeat(31);
        mockMvc.perform(asUser(json(post("/tag"), "{\"name\":\"" + name + "\",\"color\":\"blue\"}"), 1L))
                .andExpect(status().isBadRequest());
        verify(tagService, never()).createTag(any(), any());
    }

    @Test
    void createTag_duplicateName_returns409() throws Exception {
        when(tagService.createTag(eq(1L), any()))
                .thenThrow(new DuplicateResourceException("You already have a tag called \"Work\""));

        mockMvc.perform(asUser(json(post("/tag"), "{\"name\":\"Work\",\"color\":\"blue\"}"), 1L))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("You already have a tag called \"Work\"")));
    }

    @Test
    void updateTag_returnsTheUpdatedTag() throws Exception {
        when(tagService.updateTag(eq(5L), eq(1L), any())).thenReturn(new TagDto(5L, "Work", "teal", 2));

        mockMvc.perform(asUser(json(put("/tag/{id}", 5L), "{\"name\":\"Work\",\"color\":\"teal\"}"), 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.color", is("teal")))
                .andExpect(jsonPath("$.contactCount", is(2)));
    }

    @Test
    void deleteTag_returns204() throws Exception {
        mockMvc.perform(asUser(delete("/tag/{id}", 5L), 1L))
                .andExpect(status().isNoContent());

        verify(tagService).deleteTag(5L, 1L);
    }

    @Test
    void deleteTag_notTheUsers_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("Tag not found with id 5")).when(tagService).deleteTag(5L, 1L);

        mockMvc.perform(asUser(delete("/tag/{id}", 5L), 1L))
                .andExpect(status().isNotFound());
    }
}

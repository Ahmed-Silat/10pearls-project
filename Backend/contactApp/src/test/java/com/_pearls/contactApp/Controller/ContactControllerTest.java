package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.ExceptionHandling.GlobalExceptionHandler;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Service.ContactService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ContactControllerTest {

    @Mock
    private ContactService contactService;

    @InjectMocks
    private ContactController contactController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(contactController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /** Sets the authenticated principal for the upcoming request. */
    private MockHttpServletRequestBuilder asUser(MockHttpServletRequestBuilder builder, String userId) {
        User user = User.builder().id(userId).email("me@example.com").password("x").build();
        Authentication auth = new UsernamePasswordAuthenticationToken(new AuthUser(user), null, Collections.emptyList());
        return builder.with(request -> {
            SecurityContextHolder.getContext().setAuthentication(auth);
            return request;
        });
    }

    private ContactDto sampleContact(String id) {
        ContactDto dto = new ContactDto();
        dto.setId(id);
        dto.setFirstName("alice");
        dto.setLastName("doe");
        dto.setEmail("alice@example.com");
        dto.setPhone("0300");
        dto.setAddress("Karachi");
        return dto;
    }

    @Test
    void getContactsByUserId_returnsPaginationEnvelope() throws Exception {
        PaginationDto<ContactDto> page = new PaginationDto<>();
        page.setContacts(List.of(sampleContact("c1")));
        page.setTotalContacts(1);
        page.setTotalPages(1);
        page.setContactsPerPage(10);
        page.setCurrentPage(1);

        when(contactService.getContactsByUserId(eq("user-1"), any(), any(), eq(1), eq(10))).thenReturn(page);

        mockMvc.perform(asUser(get("/contact/user/{id}", "user-1"), "user-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contacts", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.contacts[0].id", org.hamcrest.Matchers.is("c1")))
                .andExpect(jsonPath("$.contacts[0].firstName", org.hamcrest.Matchers.is("alice")))
                .andExpect(jsonPath("$.contacts[0].owner").doesNotExist())
                .andExpect(jsonPath("$.contacts[0].user").doesNotExist())
                .andExpect(jsonPath("$.totalContacts", org.hamcrest.Matchers.is(1)))
                .andExpect(jsonPath("$.totalPages", org.hamcrest.Matchers.is(1)));
    }

    @Test
    void getContactsByUserId_forAnotherUser_returns403() throws Exception {
        mockMvc.perform(asUser(get("/contact/user/{id}", "someone-else"), "user-1"))
                .andExpect(status().isForbidden());

        verify(contactService, never()).getContactsByUserId(any(), any(), any(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void createContact_createsForPrincipalIgnoringRequestBodyUserId() throws Exception {
        ContactDto created = sampleContact("c1");
        when(contactService.createContact(eq("user-1"), any())).thenReturn(created);

        String body = """
                {"firstName":"Alice","lastName":"Doe","email":"alice@example.com",
                 "phone":"0300","address":"Karachi"}""";

        mockMvc.perform(asUser(post("/contact"), "user-1")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", org.hamcrest.Matchers.is("c1")));

        verify(contactService).createContact(eq("user-1"), any());
    }

    @Test
    void createContact_missingPhone_returns400() throws Exception {
        mockMvc.perform(asUser(post("/contact"), "user-1")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Alice\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.phone").exists())
                .andExpect(jsonPath("$.errors.lastName").doesNotExist())
                .andExpect(jsonPath("$.errors.email").doesNotExist());
    }

    @Test
    void createContact_withOnlyFirstNameAndPhone_returns201() throws Exception {
        when(contactService.createContact(eq("user-1"), any())).thenReturn(sampleContact("c1"));

        mockMvc.perform(asUser(post("/contact"), "user-1")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Alice\",\"phone\":\"0300\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void deleteContact_returns204() throws Exception {
        mockMvc.perform(asUser(delete("/contact/{id}", "c1"), "user-1"))
                .andExpect(status().isNoContent());

        verify(contactService).deleteContact("c1", "user-1");
    }
}
package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.ContactCountsDto;
import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.DuplicateMatchDto;
import com._pearls.contactApp.ExceptionHandling.DuplicateContactException;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
    private MockHttpServletRequestBuilder asUser(MockHttpServletRequestBuilder builder, Long userId) {
        User user = User.builder().id(userId).email("me@example.com").password("x").build();
        Authentication auth = new UsernamePasswordAuthenticationToken(new AuthUser(user), null, Collections.emptyList());
        return builder.with(request -> {
            SecurityContextHolder.getContext().setAuthentication(auth);
            return request;
        });
    }

    private ContactDto sampleContact(Long id) {
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
        page.setContacts(List.of(sampleContact(10L)));
        page.setTotalContacts(1);
        page.setTotalPages(1);
        page.setContactsPerPage(10);
        page.setCurrentPage(1);

        when(contactService.getContactsByUserId(eq(1L), any(), any(), eq(1), eq(10), eq("all"))).thenReturn(page);

        mockMvc.perform(asUser(get("/contact/user/{id}", 1L), 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contacts", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.contacts[0].id", org.hamcrest.Matchers.is(10)))
                .andExpect(jsonPath("$.contacts[0].firstName", org.hamcrest.Matchers.is("alice")))
                .andExpect(jsonPath("$.contacts[0].owner").doesNotExist())
                .andExpect(jsonPath("$.contacts[0].user").doesNotExist())
                .andExpect(jsonPath("$.totalContacts", org.hamcrest.Matchers.is(1)))
                .andExpect(jsonPath("$.totalPages", org.hamcrest.Matchers.is(1)));
    }

    @Test
    void getContactsByUserId_forAnotherUser_returns403() throws Exception {
        mockMvc.perform(asUser(get("/contact/user/{id}", 2L), 1L))
                .andExpect(status().isForbidden());

        verify(contactService, never()).getContactsByUserId(any(), any(), any(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt(), any());
    }

    @Test
    void createContact_createsForPrincipalIgnoringRequestBodyUserId() throws Exception {
        ContactDto created = sampleContact(10L);
        when(contactService.createContact(eq(1L), any())).thenReturn(created);

        String body = """
                {"firstName":"Alice","lastName":"Doe","email":"alice@example.com",
                 "phone":"0300","address":"Karachi"}""";

        mockMvc.perform(asUser(post("/contact"), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", org.hamcrest.Matchers.is(10)));

        verify(contactService).createContact(eq(1L), any());
    }

    @Test
    void createContact_missingPhone_returns400() throws Exception {
        mockMvc.perform(asUser(post("/contact"), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Alice\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.phone").exists())
                .andExpect(jsonPath("$.errors.lastName").doesNotExist())
                .andExpect(jsonPath("$.errors.email").doesNotExist());
    }

    @Test
    void createContact_withOnlyFirstNameAndPhone_returns201() throws Exception {
        when(contactService.createContact(eq(1L), any())).thenReturn(sampleContact(10L));

        mockMvc.perform(asUser(post("/contact"), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Alice\",\"phone\":\"0300\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void deleteContact_returns204() throws Exception {
        mockMvc.perform(asUser(delete("/contact/{id}", 10L), 1L))
                .andExpect(status().isNoContent());

        verify(contactService).deleteContact(10L, 1L);
    }

    @Test
    void setFavorite_returnsUpdatedContact() throws Exception {
        ContactDto starred = sampleContact(10L);
        starred.setFavorite(true);
        when(contactService.setFavorite(10L, 1L, true)).thenReturn(starred);

        mockMvc.perform(asUser(patch("/contact/{id}/favorite", 10L), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"favorite\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorite", org.hamcrest.Matchers.is(true)));
    }

    @Test
    void getRecentlyDeleted_returnsTheSignedInUsersList() throws Exception {
        PaginationDto<ContactDto> page = new PaginationDto<>();
        ContactDto deleted = sampleContact(10L);
        deleted.setDeletedAt("2026-10-24T10:00:00Z");
        deleted.setDeletesPermanentlyAt("2026-11-23T10:00:00Z");
        page.setContacts(List.of(deleted));
        page.setTotalContacts(1);
        page.setTotalPages(1);
        page.setCurrentPage(1);
        when(contactService.getRecentlyDeleted(1L, 1)).thenReturn(page);

        mockMvc.perform(asUser(get("/contact/deleted"), 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contacts[0].id", org.hamcrest.Matchers.is(10)))
                .andExpect(jsonPath("$.contacts[0].deletesPermanentlyAt",
                        org.hamcrest.Matchers.is("2026-11-23T10:00:00Z")));
    }

    @Test
    void deletePermanently_returns204() throws Exception {
        mockMvc.perform(asUser(delete("/contact/deleted/{id}", 10L), 1L))
                .andExpect(status().isNoContent());

        verify(contactService).deletePermanently(10L, 1L);
    }

    @Test
    void restoreContact_returnsTheRestoredContact() throws Exception {
        when(contactService.restoreContact(10L, 1L, false)).thenReturn(sampleContact(10L));

        mockMvc.perform(asUser(post("/contact/{id}/restore", 10L), 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", org.hamcrest.Matchers.is(10)));
    }

    @Test
    void restoreContact_canRestoreAnyway() throws Exception {
        when(contactService.restoreContact(10L, 1L, true)).thenReturn(sampleContact(10L));

        mockMvc.perform(asUser(post("/contact/{id}/restore", 10L).param("allowDuplicate", "true"), 1L))
                .andExpect(status().isOk());

        verify(contactService).restoreContact(10L, 1L, true);
    }

    @Test
    void findDuplicates_returnsTheMatchingContacts() throws Exception {
        when(contactService.findDuplicates(1L, 7L, "0300 1234567", null))
                .thenReturn(List.of(new DuplicateMatchDto(5L, "ali", "khan", "phone")));

        mockMvc.perform(asUser(get("/contact/duplicates").param("phone", "0300 1234567").param("excludeId", "7"), 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", org.hamcrest.Matchers.is(5)))
                .andExpect(jsonPath("$[0].firstName", org.hamcrest.Matchers.is("ali")))
                .andExpect(jsonPath("$[0].field", org.hamcrest.Matchers.is("phone")));
    }

    @Test
    void duplicateOnSave_is409WithTheMatchingContacts() throws Exception {
        when(contactService.createContact(eq(1L), any())).thenThrow(new DuplicateContactException(
                "You already have a contact with this phone number",
                List.of(new DuplicateMatchDto(5L, "ali", "khan", "phone"))));

        mockMvc.perform(asUser(post("/contact"), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Alice\",\"phone\":\"0300\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.is("You already have a contact with this phone number")))
                .andExpect(jsonPath("$.duplicates[0].firstName", org.hamcrest.Matchers.is("ali")))
                .andExpect(jsonPath("$.duplicates[0].field", org.hamcrest.Matchers.is("phone")));
    }

    @Test
    void allowDuplicate_isReadFromTheRequestBody() throws Exception {
        when(contactService.createContact(eq(1L), any())).thenReturn(sampleContact(10L));

        mockMvc.perform(asUser(post("/contact"), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Alice\",\"phone\":\"0300\",\"allowDuplicate\":true}"))
                .andExpect(status().isCreated());

        verify(contactService).createContact(eq(1L), org.mockito.ArgumentMatchers.argThat(
                com._pearls.contactApp.Dto.ContactRequest::isAllowDuplicate));
    }

    @Test
    void getContactsByUserId_passesTheFilterThrough() throws Exception {
        when(contactService.getContactsByUserId(eq(1L), any(), any(), eq(1), eq(10), eq("favorites")))
                .thenReturn(new PaginationDto<>());

        mockMvc.perform(asUser(get("/contact/user/{id}", 1L).param("filter", "favorites"), 1L))
                .andExpect(status().isOk());

        verify(contactService).getContactsByUserId(eq(1L), any(), any(), eq(1), eq(10), eq("favorites"));
    }

    @Test
    void getCounts_returnsEachSection() throws Exception {
        when(contactService.getCounts(1L)).thenReturn(new ContactCountsDto(24, 5, 2, 3));

        mockMvc.perform(asUser(get("/contact/counts"), 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.all", org.hamcrest.Matchers.is(24)))
                .andExpect(jsonPath("$.favorites", org.hamcrest.Matchers.is(5)))
                .andExpect(jsonPath("$.emergency", org.hamcrest.Matchers.is(2)))
                .andExpect(jsonPath("$.recentlyDeleted", org.hamcrest.Matchers.is(3)));
    }

    @Test
    void setFavorite_withoutAValue_returns400() throws Exception {
        mockMvc.perform(asUser(patch("/contact/{id}/favorite", 10L), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(contactService, never()).setFavorite(any(), any(), org.mockito.ArgumentMatchers.anyBoolean());
    }

    @Test
    void setEmergency_returnsUpdatedContact() throws Exception {
        ContactDto marked = sampleContact(10L);
        marked.setEmergency(true);
        when(contactService.setEmergency(10L, 1L, true)).thenReturn(marked);

        mockMvc.perform(asUser(patch("/contact/{id}/emergency", 10L), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"emergency\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emergency", org.hamcrest.Matchers.is(true)));
    }

    @Test
    void setEmergency_withoutAValue_returns400() throws Exception {
        mockMvc.perform(asUser(patch("/contact/{id}/emergency", 10L), 1L)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(contactService, never()).setEmergency(any(), any(), org.mockito.ArgumentMatchers.anyBoolean());
    }
}

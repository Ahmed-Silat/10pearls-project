package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.ImportIssueDto;
import com._pearls.contactApp.Dto.ImportResultDto;
import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.ExceptionHandling.GlobalExceptionHandler;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Service.ContactExportService;
import com._pearls.contactApp.Service.ContactImportService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ContactTransferControllerTest {

    @Mock
    private ContactExportService exportService;

    @Mock
    private ContactImportService importService;

    @InjectMocks
    private ContactTransferController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequestBuilder asUser(MockHttpServletRequestBuilder builder) {
        User user = User.builder().id(1L).email("me@example.com").password("x").build();
        var auth = new UsernamePasswordAuthenticationToken(new AuthUser(user), null, Collections.emptyList());
        return builder.with(request -> {
            SecurityContextHolder.getContext().setAuthentication(auth);
            return request;
        });
    }

    @Test
    void export_downloadsAFileNamedWithTodaysDate() throws Exception {
        byte[] csv = "First Name\r\nAli\r\n".getBytes(StandardCharsets.UTF_8);
        when(exportService.export(1L, "csv"))
                .thenReturn(new ContactExportService.ExportFile(csv, "text/csv; charset=UTF-8", "csv"));

        mockMvc.perform(asUser(get("/contact/export").param("format", "csv")))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"contacts-" + LocalDate.now() + ".csv\""))
                .andExpect(content().bytes(csv));
    }

    @Test
    void export_unknownFormat_returns400() throws Exception {
        when(exportService.export(1L, "pdf")).thenThrow(new BadRequestException("format must be csv or vcf"));

        mockMvc.perform(asUser(get("/contact/export").param("format", "pdf")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("format must be csv or vcf")));
    }

    @Test
    void import_passesTheFileAndOptionsOn_andReturnsTheSummary() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "phone.vcf", "text/vcard",
                "BEGIN:VCARD\r\nEND:VCARD\r\n".getBytes(StandardCharsets.UTF_8));
        when(importService.importContacts(eq(1L), eq("phone.vcf"), any(), eq(true), eq(false)))
                .thenReturn(new ImportResultDto(true, 3, 2, List.of("Family"), List.of(),
                        List.of(new ImportIssueDto("Contact 3", "Bob", "Has no phone number")), List.of()));

        mockMvc.perform(asUser(multipart("/contact/import").file(file).param("dryRun", "true")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun", is(true)))
                .andExpect(jsonPath("$.imported", is(2)))
                .andExpect(jsonPath("$.newTags[0]", is("Family")))
                .andExpect(jsonPath("$.problems[0].location", is("Contact 3")))
                .andExpect(jsonPath("$.problems[0].message", is("Has no phone number")));
    }

    @Test
    void import_withoutAFile_returns400() throws Exception {
        mockMvc.perform(asUser(multipart("/contact/import")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Choose a file to upload")));

        verify(importService, never()).importContacts(any(), any(), any(), anyBoolean(), anyBoolean());
    }
}

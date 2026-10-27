package com._pearls.contactApp.Service;

import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.ContactDetail;
import com._pearls.contactApp.Model.Tag;
import com._pearls.contactApp.Repo.ContactRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContactExportServiceTest {

    @Mock
    private ContactRepo contactRepo;

    @InjectMocks
    private ContactExportService exportService;

    private static Contact ali() {
        return Contact.builder()
                .id(10L).firstName("ali").lastName("khan").phone("+92 300 1234567").email("ali@example.com")
                .company("Acme; Sons").birthday(LocalDate.of(1990, 5, 14)).notes("=1+1")
                .additionalPhones(new ArrayList<>(List.of(new ContactDetail("work", "021 111 2222"))))
                .additionalEmails(new ArrayList<>())
                .favorite(true)
                .tags(new HashSet<>(Set.of(Tag.builder().name("Work").build(), Tag.builder().name("family").build())))
                .build();
    }

    @Test
    void csv_hasAHeaderAndOneRowPerContact_readyForExcel() {
        when(contactRepo.findByUser_IdOrderByFirstNameAscLastNameAscIdAsc(1L)).thenReturn(List.of(ali()));

        ContactExportService.ExportFile file = exportService.export(1L, "csv");
        String csv = new String(file.content(), StandardCharsets.UTF_8);

        assertThat(file.contentType()).isEqualTo("text/csv; charset=UTF-8");
        assertThat(csv).startsWith("﻿First Name,Last Name,Phone,Email,Other Phones,Other Emails,Company,"
                + "Birthday,Address,Notes,Tags,Favorite,Emergency\r\n");
        assertThat(csv).contains("Ali,Khan,+92 300 1234567,ali@example.com,work: 021 111 2222,,\"Acme; Sons\","
                + "1990-05-14,,'=1+1,\"family; Work\",Yes,\r\n");
    }

    @Test
    void vCard_hasACardPerContact() {
        when(contactRepo.findByUser_IdOrderByFirstNameAscLastNameAscIdAsc(1L)).thenReturn(List.of(ali()));

        String vcf = new String(exportService.export(1L, "vcf").content(), StandardCharsets.UTF_8);

        assertThat(vcf).isEqualTo(String.join("\r\n",
                "BEGIN:VCARD",
                "VERSION:3.0",
                "N:Khan;Ali;;;",
                "FN:Ali Khan",
                "ORG:Acme\\; Sons",
                "TEL;TYPE=VOICE,PREF:+92 300 1234567",
                "TEL;TYPE=WORK:021 111 2222",
                "EMAIL;TYPE=INTERNET,PREF:ali@example.com",
                "BDAY:1990-05-14",
                "NOTE:=1+1",
                "CATEGORIES:family,Work",
                "X-CONTACTHUB-FAVORITE:TRUE",
                "END:VCARD",
                ""));
    }

    @Test
    void anUnknownFormat_isRejected() {
        when(contactRepo.findByUser_IdOrderByFirstNameAscLastNameAscIdAsc(1L)).thenReturn(List.of());

        assertThatThrownBy(() -> exportService.export(1L, "pdf")).isInstanceOf(BadRequestException.class);
    }

    @Test
    void displayCase_capitalisesLowerCaseNames_only() {
        assertThat(ContactExportService.displayCase("ali raza khan")).isEqualTo("Ali Raza Khan");
        assertThat(ContactExportService.displayCase("de la Cruz")).isEqualTo("de la Cruz");
        assertThat(ContactExportService.displayCase("محمد")).isEqualTo("محمد");
        assertThat(ContactExportService.displayCase(null)).isEmpty();
    }
}

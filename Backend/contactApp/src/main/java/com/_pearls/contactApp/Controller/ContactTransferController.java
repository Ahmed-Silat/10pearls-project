package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.ImportResultDto;
import com._pearls.contactApp.Service.ContactExportService;
import com._pearls.contactApp.Service.ContactImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;

/** Exporting the signed-in user's contacts to a file, and importing them from one. */
@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
public class ContactTransferController {

    private final ContactExportService exportService;
    private final ContactImportService importService;

    /**
     * Downloads all contacts (not those in Recently deleted) as {@code format=csv} (for spreadsheets) or
     * {@code format=vcf} (vCard, for phones and email apps).
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportContacts(@RequestParam(defaultValue = "csv") String format,
            @AuthenticationPrincipal AuthUser principal) {
        ContactExportService.ExportFile file = exportService.export(principal.getId(), format);
        String fileName = "contacts-" + LocalDate.now() + "." + file.extension();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
                .body(file.content());
    }

    /**
     * Imports contacts from an uploaded CSV or vCard file (the multipart field "file", up to 5 MB and 1000
     * contacts). With {@code dryRun=true} nothing is saved: the result says what an import would do, for the user
     * to confirm. {@code allowDuplicates=true} also imports contacts that look like ones the user already has.
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResultDto importContacts(@RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean dryRun,
            @RequestParam(defaultValue = "false") boolean allowDuplicates,
            @AuthenticationPrincipal AuthUser principal) throws IOException {
        return importService.importContacts(principal.getId(), file.getOriginalFilename(), file.getBytes(), dryRun,
                allowDuplicates);
    }
}

package com._pearls.contactApp.Service;

import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.ContactDetail;
import com._pearls.contactApp.Model.Tag;
import com._pearls.contactApp.Repo.ContactRepo;
import com._pearls.contactApp.Util.Csv;
import com._pearls.contactApp.Util.VCard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Exports all of a user's contacts (not those in Recently deleted) as CSV, for spreadsheets, or vCard, for
 * phones and email apps. Both include everything a contact has, and {@link ContactImportService} reads both back.
 */
@Service
@RequiredArgsConstructor
public class ContactExportService {

    public static final String FORMAT_CSV = "csv";
    public static final String FORMAT_VCARD = "vcf";

    /** The CSV columns, in order. Import recognises these names (and those of Google and Outlook exports). */
    public static final List<String> CSV_COLUMNS = List.of(
            "First Name", "Last Name", "Phone", "Email", "Other Phones", "Other Emails", "Company", "Birthday",
            "Address", "Notes", "Tags", "Favorite", "Emergency");

    /** Lets Excel tell the file is UTF-8, so names in Urdu, Arabic etc. show correctly. */
    private static final String BYTE_ORDER_MARK = "﻿";

    /** vCard TYPE for each label of an extra phone number. */
    private static final Map<String, String> PHONE_TYPES = Map.of(
            "mobile", "CELL", "work", "WORK", "home", "HOME", "other", "VOICE");

    private final ContactRepo contactRepo;

    /** An exported file: its bytes, content type and a suggested file name extension. */
    public record ExportFile(byte[] content, String contentType, String extension) {
    }

    @Transactional(readOnly = true)
    public ExportFile export(Long userId, String format) {
        List<Contact> contacts = contactRepo.findByUser_IdOrderByFirstNameAscLastNameAscIdAsc(userId);
        if (FORMAT_CSV.equalsIgnoreCase(format)) {
            String csv = BYTE_ORDER_MARK + toCsv(contacts);
            return new ExportFile(csv.getBytes(StandardCharsets.UTF_8), "text/csv; charset=UTF-8", FORMAT_CSV);
        }
        if (FORMAT_VCARD.equalsIgnoreCase(format)) {
            return new ExportFile(toVCard(contacts).getBytes(StandardCharsets.UTF_8), "text/vcard; charset=UTF-8",
                    FORMAT_VCARD);
        }
        throw new BadRequestException("format must be csv or vcf");
    }

    static String toCsv(List<Contact> contacts) {
        List<List<String>> rows = new ArrayList<>();
        rows.add(CSV_COLUMNS);
        for (Contact contact : contacts) {
            rows.add(List.of(
                    displayCase(contact.getFirstName()),
                    displayCase(contact.getLastName()),
                    blankIfNull(contact.getPhone()),
                    blankIfNull(contact.getEmail()),
                    labelled(contact.getAdditionalPhones()),
                    labelled(contact.getAdditionalEmails()),
                    blankIfNull(contact.getCompany()),
                    contact.getBirthday() == null ? "" : contact.getBirthday().toString(),
                    blankIfNull(contact.getAddress()),
                    blankIfNull(contact.getNotes()),
                    String.join("; ", tagNames(contact)),
                    contact.isFavorite() ? "Yes" : "",
                    contact.isEmergency() ? "Yes" : ""));
        }
        return Csv.write(rows);
    }

    static String toVCard(List<Contact> contacts) {
        VCard.Writer writer = new VCard.Writer();
        for (Contact contact : contacts) {
            String first = displayCase(contact.getFirstName());
            String last = displayCase(contact.getLastName());
            writer.begin()
                    .structured("N", last, first, "", "", "")
                    .text("FN", String.join(" ", List.of(first, last).stream().filter(s -> !s.isEmpty()).toList()));
            if (contact.getCompany() != null) {
                writer.structured("ORG", contact.getCompany());
            }
            writer.text("TEL;TYPE=VOICE,PREF", contact.getPhone());
            for (ContactDetail phone : contact.getAdditionalPhones()) {
                writer.text("TEL;TYPE=" + PHONE_TYPES.getOrDefault(phone.getLabel(), "VOICE"), phone.getValue());
            }
            writer.text("EMAIL;TYPE=INTERNET,PREF", contact.getEmail());
            for (ContactDetail email : contact.getAdditionalEmails()) {
                String type = switch (email.getLabel()) {
                    case "work" -> "INTERNET,WORK";
                    case "home" -> "INTERNET,HOME";
                    default -> "INTERNET";
                };
                writer.text("EMAIL;TYPE=" + type, email.getValue());
            }
            if (contact.getBirthday() != null) {
                writer.raw("BDAY", contact.getBirthday().toString());
            }
            if (contact.getAddress() != null && !contact.getAddress().isBlank()) {
                // The app keeps the address as one line, so it all goes in the street part.
                writer.structured("ADR;TYPE=HOME", "", "", contact.getAddress(), "", "", "", "");
            }
            writer.text("NOTE", contact.getNotes())
                    .list("CATEGORIES", tagNames(contact));
            if (contact.isFavorite()) {
                writer.raw(ContactImportService.VCARD_FAVORITE, "TRUE");
            }
            if (contact.isEmergency()) {
                writer.raw(ContactImportService.VCARD_EMERGENCY, "TRUE");
            }
            writer.end();
        }
        return writer.toString();
    }

    /** "work: 021 111 2222; home: 042 333 4444", which import reads back. */
    private static String labelled(List<ContactDetail> details) {
        return details.stream()
                .map(detail -> detail.getLabel() + ": " + detail.getValue())
                .collect(Collectors.joining("; "));
    }

    private static List<String> tagNames(Contact contact) {
        return contact.getTags().stream()
                .map(Tag::getName)
                .sorted(Comparator.comparing(String::toLowerCase))
                .toList();
    }

    private static String blankIfNull(String value) {
        return value == null ? "" : value;
    }

    /**
     * Names are stored in lower case; the app shows each word with a capital letter, and so does the export
     * ("ali khan" becomes "Ali Khan"). A value that already has capitals ("de la Cruz") is left as it is, so this
     * keeps working once names are stored with their real case.
     */
    static String displayCase(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder out = new StringBuilder(value.length());
        boolean startOfWord = true;
        for (int i = 0; i < value.length(); ) {
            int codePoint = value.codePointAt(i);
            out.appendCodePoint(startOfWord ? Character.toUpperCase(codePoint) : codePoint);
            startOfWord = Character.isWhitespace(codePoint);
            i += Character.charCount(codePoint);
        }
        return out.toString().toLowerCase(Locale.ROOT).equals(value) ? out.toString() : value;
    }
}

package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ContactRequest;
import com._pearls.contactApp.Dto.EmailEntryRequest;
import com._pearls.contactApp.Dto.ImportIssueDto;
import com._pearls.contactApp.Dto.ImportResultDto;
import com._pearls.contactApp.Dto.PhoneEntryRequest;
import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.Tag;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.ContactRepo;
import com._pearls.contactApp.Repo.TagRepo;
import com._pearls.contactApp.Repo.UserRepo;
import com._pearls.contactApp.Util.Csv;
import com._pearls.contactApp.Util.VCard;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com._pearls.contactApp.Util.TextUtils.collapseSpaces;

/**
 * Imports contacts from a CSV or vCard (.vcf) file. CSV columns are matched by name, so besides this app's own
 * export, files from Google Contacts, Outlook and hand-made spreadsheets work too.
 *
 * <p>Each contact goes through the same rules as one added by hand: it needs a name and a valid phone number,
 * and one with the same phone number or email as an existing contact (or an earlier one in the file) is left out
 * as a duplicate unless duplicates are allowed. Contacts that can't be imported are reported with the reason;
 * the rest are saved together, in one transaction. A dry run reports the same without saving anything, for the
 * preview the user confirms.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactImportService {

    /** vCard properties this app adds to its exports so a re-import keeps the star and the emergency mark. */
    public static final String VCARD_FAVORITE = "X-CONTACTHUB-FAVORITE";
    public static final String VCARD_EMERGENCY = "X-CONTACTHUB-EMERGENCY";

    /** Most contacts one file can have. */
    static final int MAX_CONTACTS = 1000;

    static final String EMPTY_FILE = "This file is empty";
    static final String NO_CONTACTS = "No contacts were found in this file";
    static final String NOT_A_CONTACTS_FILE =
            "This doesn't look like a contacts file. Choose a CSV file with columns such as First Name and Phone, "
                    + "or a vCard (.vcf) file";

    private static final int MAX_NAME = 50;
    private static final int MAX_COMPANY = 100;
    private static final int MAX_ADDRESS = 255;
    private static final int MAX_NOTES = 2000;
    private static final int MAX_EMAIL = 100;
    private static final int MAX_TAG_NAME = 30;
    private static final int MIN_BIRTHDAY_YEAR = 1900;

    /** Colours given to tags an import creates, in turn. */
    private static final List<String> NEW_TAG_COLORS =
            List.of("blue", "green", "violet", "orange", "teal", "pink", "amber", "red");

    private static final Pattern PHONE_CHARACTERS = Pattern.compile("\\+?[\\d\\s().-]+");
    private static final Pattern EMAIL = Pattern.compile("[^\\s@]+@[^\\s@]+\\.[^\\s@]+");
    /** Google's numbered columns: "Phone 1 - Type", "Phone 1 - Value", "E-mail 2 - Value", ... */
    private static final Pattern NUMBERED_COLUMN =
            Pattern.compile("(phone|e-?mail)\\s*(\\d+)\\s*-\\s*(type|label|value)");
    /** Several values in one cell: "0300 ::: 0311" (Google) or "Family; Work". */
    private static final Pattern MULTI_VALUE = Pattern.compile("\\s*(?::::|;)\\s*");
    private static final Set<String> TRUE_WORDS = Set.of("yes", "y", "true", "1", "x", "✓");

    private final ContactService contactService;
    private final ContactRepo contactRepo;
    private final TagRepo tagRepo;
    private final UserRepo userRepo;
    private final Validator validator;

    // The import ----------------------------------------------------------------------------------------------

    /**
     * Reads the file and imports its contacts, or with {@code dryRun} only reports what would happen. With
     * {@code allowDuplicates}, contacts that look like duplicates are imported too. 400 if the file is empty, too
     * big or not a contacts file.
     */
    @Transactional
    public ImportResultDto importContacts(Long userId, String fileName, byte[] content, boolean dryRun,
                                          boolean allowDuplicates) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        List<Draft> drafts = read(fileName, content);

        List<ImportIssueDto> problems = new ArrayList<>();
        List<ImportIssueDto> duplicates = new ArrayList<>();
        List<ImportIssueDto> warnings = new ArrayList<>();
        List<Checked> accepted = new ArrayList<>();
        DuplicateFinder duplicateFinder = new DuplicateFinder(
                contactRepo.findByUser_IdOrderByFirstNameAscLastNameAscIdAsc(userId));

        for (Draft draft : drafts) {
            Checked checked;
            try {
                checked = check(draft);
            } catch (Rejected rejected) {
                problems.add(issue(draft, rejected.getMessage()));
                continue;
            }
            String duplicate = duplicateFinder.find(checked);
            if (duplicate != null && !allowDuplicates) {
                duplicates.add(issue(draft, duplicate));
                continue;
            }
            duplicateFinder.remember(checked);
            accepted.add(checked);
            draft.warnings.forEach(warning -> warnings.add(issue(draft, warning)));
        }

        Map<String, Tag> tagsByName = new HashMap<>();
        tagRepo.findByUser_Id(userId).forEach(tag -> tagsByName.put(key(tag.getName()), tag));
        List<String> newTags = accepted.stream()
                .flatMap(checked -> checked.tagNames().stream())
                .filter(name -> !tagsByName.containsKey(key(name)))
                .collect(LinkedHashMap<String, String>::new, (map, name) -> map.putIfAbsent(key(name), name),
                        Map::putAll)
                .values().stream().toList();

        if (!dryRun) {
            save(user, accepted, newTags, tagsByName);
            log.info("User {} imported {} contact(s) and {} new tag(s) from {}", userId, accepted.size(),
                    newTags.size(), fileName);
        }
        return new ImportResultDto(dryRun, drafts.size(), accepted.size(), newTags, duplicates, problems, warnings);
    }

    private void save(User user, List<Checked> accepted, List<String> newTags, Map<String, Tag> tagsByName) {
        List<Tag> created = new ArrayList<>();
        for (int i = 0; i < newTags.size(); i++) {
            String color = NEW_TAG_COLORS.get(i % NEW_TAG_COLORS.size());
            created.add(Tag.builder().name(newTags.get(i)).color(color).user(user).build());
        }
        tagRepo.saveAll(created).forEach(tag -> tagsByName.put(key(tag.getName()), tag));

        List<Contact> contacts = new ArrayList<>();
        for (Checked checked : accepted) {
            Contact contact = contactService.buildNewContact(user, checked.request());
            contact.setFavorite(checked.favorite());
            checked.tagNames().forEach(name -> contact.getTags().add(tagsByName.get(key(name))));
            contacts.add(contact);
        }
        contactRepo.saveAll(contacts);
    }

    private static String key(String tagName) {
        return tagName.toLowerCase(Locale.ROOT);
    }

    private static ImportIssueDto issue(Draft draft, String message) {
        return new ImportIssueDto(draft.location, draft.displayName(), message);
    }

    // Reading the file ----------------------------------------------------------------------------------------

    /** One contact as written in the file, before it is checked. */
    static final class Draft {
        final String location;
        String firstName;
        String lastName;
        String fullName;
        String company;
        String birthday;
        String address;
        final List<String> notes = new ArrayList<>();
        /** In order; a null label means the file didn't give one. */
        final List<Entry> phones = new ArrayList<>();
        final List<Entry> emails = new ArrayList<>();
        final List<String> tags = new ArrayList<>();
        boolean favorite;
        boolean emergency;
        final List<String> warnings = new ArrayList<>();

        Draft(String location) {
            this.location = location;
        }

        /** The name as the file gives it, for messages. */
        String displayName() {
            String name = String.join(" ", nonBlank(firstName, lastName));
            if (name.isEmpty()) {
                name = firstNonBlank(fullName, company);
            }
            return name == null ? "" : name;
        }
    }

    /** A phone number or email and its label (mobile, work, home, other, or null). */
    record Entry(String label, String value) {
    }

    List<Draft> read(String fileName, byte[] content) {
        String text = decode(content);
        if (text.isBlank()) {
            throw new BadRequestException(EMPTY_FILE);
        }
        String start = text.stripLeading();
        boolean vCard = start.regionMatches(true, 0, "BEGIN:VCARD", 0, "BEGIN:VCARD".length())
                || (fileName != null && fileName.toLowerCase(Locale.ROOT).matches(".*\\.(vcf|vcard)"));
        List<Draft> drafts = vCard ? readVCards(text) : readCsv(text);
        if (drafts.isEmpty()) {
            throw new BadRequestException(NO_CONTACTS);
        }
        if (drafts.size() > MAX_CONTACTS) {
            throw new BadRequestException("This file has " + drafts.size() + " contacts. Import at most "
                    + MAX_CONTACTS + " at a time; split the file and import each part.");
        }
        return drafts;
    }

    /**
     * The file's text. UTF-8 is expected; a file with a UTF-16 byte order mark (Excel's "Unicode text") is read as
     * UTF-16, and one that isn't valid UTF-8 as Windows-1252 (older Outlook and Excel exports).
     */
    static String decode(byte[] content) {
        String text;
        if (content.length >= 2 && ((content[0] == (byte) 0xFF && content[1] == (byte) 0xFE)
                || (content[0] == (byte) 0xFE && content[1] == (byte) 0xFF))) {
            text = new String(content, StandardCharsets.UTF_16);
        } else {
            try {
                text = StandardCharsets.UTF_8.newDecoder()
                        .onMalformedInput(CodingErrorAction.REPORT)
                        .onUnmappableCharacter(CodingErrorAction.REPORT)
                        .decode(ByteBuffer.wrap(content))
                        .toString();
            } catch (CharacterCodingException ex) {
                text = new String(content, Charset.forName("windows-1252"));
            }
        }
        return text.startsWith("﻿") ? text.substring(1) : text;
    }

    // CSV ---------------------------------------------------------------------------------------------------

    enum Role {
        FIRST, LAST, FULL, COMPANY, BIRTHDAY, NOTES, ADDRESS, PHONE, EMAIL, OTHER_PHONES, OTHER_EMAILS,
        NUMBERED_PHONE_VALUE, NUMBERED_PHONE_TYPE, NUMBERED_EMAIL_VALUE, NUMBERED_EMAIL_TYPE,
        TAGS, FAVORITE, EMERGENCY, IGNORED
    }

    /** What a CSV column holds. {@code label} is for phone and email columns, {@code number} for numbered ones. */
    record Column(Role role, String label, int number) {
        Column(Role role) {
            this(role, null, 0);
        }
    }

    /** Column names (lower case, letters and digits only) of this app, Google Contacts, Outlook and common sheets. */
    private static final Map<String, Role> COLUMN_NAMES = Map.ofEntries(
            Map.entry("firstname", Role.FIRST), Map.entry("givenname", Role.FIRST), Map.entry("first", Role.FIRST),
            Map.entry("lastname", Role.LAST), Map.entry("familyname", Role.LAST), Map.entry("surname", Role.LAST),
            Map.entry("last", Role.LAST),
            Map.entry("name", Role.FULL), Map.entry("fullname", Role.FULL), Map.entry("displayname", Role.FULL),
            Map.entry("contactname", Role.FULL),
            Map.entry("company", Role.COMPANY), Map.entry("companyname", Role.COMPANY),
            Map.entry("organization", Role.COMPANY), Map.entry("organisation", Role.COMPANY),
            Map.entry("organizationname", Role.COMPANY), Map.entry("organization1name", Role.COMPANY),
            Map.entry("org", Role.COMPANY),
            Map.entry("birthday", Role.BIRTHDAY), Map.entry("birthdate", Role.BIRTHDAY),
            Map.entry("dateofbirth", Role.BIRTHDAY), Map.entry("dob", Role.BIRTHDAY),
            Map.entry("notes", Role.NOTES), Map.entry("note", Role.NOTES), Map.entry("comments", Role.NOTES),
            Map.entry("address", Role.ADDRESS), Map.entry("homeaddress", Role.ADDRESS),
            Map.entry("address1formatted", Role.ADDRESS), Map.entry("fulladdress", Role.ADDRESS),
            Map.entry("street", Role.ADDRESS), Map.entry("homestreet", Role.ADDRESS),
            Map.entry("businessaddress", Role.ADDRESS), Map.entry("businessstreet", Role.ADDRESS),
            Map.entry("mailingaddress", Role.ADDRESS),
            Map.entry("otherphones", Role.OTHER_PHONES), Map.entry("otheremails", Role.OTHER_EMAILS),
            Map.entry("tags", Role.TAGS), Map.entry("labels", Role.TAGS), Map.entry("groups", Role.TAGS),
            Map.entry("groupmembership", Role.TAGS), Map.entry("categories", Role.TAGS),
            Map.entry("favorite", Role.FAVORITE), Map.entry("favourite", Role.FAVORITE),
            Map.entry("starred", Role.FAVORITE),
            Map.entry("emergency", Role.EMERGENCY), Map.entry("emergencycontact", Role.EMERGENCY));

    /** Phone and email column names that don't say which kind (the contact's main one, if first). */
    private static final Set<String> UNLABELLED = Set.of(
            "phone", "phones", "phonenumber", "primaryphone", "mainphone", "telephone", "tel", "number",
            "email", "emails", "emailaddress", "primaryemail");

    static Column classify(String header) {
        String lower = header.trim().toLowerCase(Locale.ROOT);
        Matcher numbered = NUMBERED_COLUMN.matcher(lower);
        if (numbered.matches()) {
            boolean phone = numbered.group(1).equals("phone");
            boolean value = numbered.group(3).equals("value");
            Role role = phone
                    ? (value ? Role.NUMBERED_PHONE_VALUE : Role.NUMBERED_PHONE_TYPE)
                    : (value ? Role.NUMBERED_EMAIL_VALUE : Role.NUMBERED_EMAIL_TYPE);
            return new Column(role, null, Integer.parseInt(numbered.group(2)));
        }
        String name = lower.replaceAll("[^\\p{L}\\p{N}]", "");
        Role known = COLUMN_NAMES.get(name);
        if (known != null) {
            return new Column(known);
        }
        if (name.contains("fax") || name.contains("pager")) {
            return new Column(Role.IGNORED);
        }
        String label = UNLABELLED.contains(name) ? null : labelOf(List.of(name));
        if (name.contains("email")) {
            return new Column(Role.EMAIL, label, 0);
        }
        if (name.contains("phone") || name.contains("mobile") || name.equals("cell") || name.equals("tel")
                || name.equals("telephone")) {
            return new Column(Role.PHONE, label, 0);
        }
        return new Column(Role.IGNORED);
    }

    /** mobile, work, home or other, from words such as "Mobile Phone", "CELL", "Business", "HOME". */
    static String labelOf(Collection<String> words) {
        for (String word : words) {
            String w = word.toLowerCase(Locale.ROOT);
            if (w.contains("mobile") || w.contains("cell") || w.contains("iphone")) {
                return "mobile";
            }
            if (w.contains("work") || w.contains("business") || w.contains("company") || w.contains("office")) {
                return "work";
            }
            if (w.contains("home") || w.contains("personal")) {
                return "home";
            }
        }
        return "other";
    }

    private List<Draft> readCsv(String text) {
        List<List<String>> rows = Csv.parse(text);
        if (rows.isEmpty()) {
            throw new BadRequestException(EMPTY_FILE);
        }
        List<Column> columns = rows.getFirst().stream().map(ContactImportService::classify).toList();
        if (columns.stream().allMatch(column -> column.role() == Role.IGNORED)) {
            throw new BadRequestException(NOT_A_CONTACTS_FILE);
        }
        List<Draft> drafts = new ArrayList<>();
        for (int r = 1; r < rows.size(); r++) {
            drafts.add(readRow("Row " + (r + 1), columns, rows.get(r)));
        }
        return drafts;
    }

    private static Draft readRow(String location, List<Column> columns, List<String> cells) {
        Draft draft = new Draft(location);
        // Google's numbered columns, gathered by number: [type, value].
        Map<Integer, String[]> numberedPhones = new TreeMap<>();
        Map<Integer, String[]> numberedEmails = new TreeMap<>();
        for (int c = 0; c < columns.size() && c < cells.size(); c++) {
            String value = Csv.unprotectFormula(cells.get(c)).strip();
            if (value.isEmpty()) {
                continue;
            }
            Column column = columns.get(c);
            switch (column.role()) {
                case FIRST -> draft.firstName = firstNonBlank(draft.firstName, value);
                case LAST -> draft.lastName = firstNonBlank(draft.lastName, value);
                case FULL -> draft.fullName = firstNonBlank(draft.fullName, value);
                case COMPANY -> draft.company = firstNonBlank(draft.company, value);
                case BIRTHDAY -> draft.birthday = firstNonBlank(draft.birthday, value);
                case ADDRESS -> draft.address = firstNonBlank(draft.address, value);
                case NOTES -> draft.notes.add(value);
                case PHONE -> splitValues(value).forEach(v -> draft.phones.add(new Entry(column.label(), v)));
                case EMAIL -> splitValues(value).forEach(v -> draft.emails.add(new Entry(column.label(), v)));
                case OTHER_PHONES -> draft.phones.addAll(labelledEntries(value));
                case OTHER_EMAILS -> draft.emails.addAll(labelledEntries(value));
                case NUMBERED_PHONE_TYPE -> numberedPhones.computeIfAbsent(column.number(), n -> new String[2])[0] = value;
                case NUMBERED_PHONE_VALUE -> numberedPhones.computeIfAbsent(column.number(), n -> new String[2])[1] = value;
                case NUMBERED_EMAIL_TYPE -> numberedEmails.computeIfAbsent(column.number(), n -> new String[2])[0] = value;
                case NUMBERED_EMAIL_VALUE -> numberedEmails.computeIfAbsent(column.number(), n -> new String[2])[1] = value;
                case TAGS -> readTags(draft, value);
                case FAVORITE -> draft.favorite = draft.favorite || isTrue(value);
                case EMERGENCY -> draft.emergency = draft.emergency || isTrue(value);
                case IGNORED -> {
                }
            }
        }
        addNumbered(numberedPhones, draft.phones);
        addNumbered(numberedEmails, draft.emails);
        return draft;
    }

    private static void addNumbered(Map<Integer, String[]> numbered, List<Entry> into) {
        for (String[] typeAndValue : numbered.values()) {
            if (typeAndValue[1] != null) {
                String label = typeAndValue[0] == null ? null : labelOf(List.of(typeAndValue[0]));
                splitValues(typeAndValue[1]).forEach(value -> into.add(new Entry(label, value)));
            }
        }
    }

    /** "work: 021 111 2222; home: 042 333 4444" (this app's Other Phones / Other Emails columns). */
    private static List<Entry> labelledEntries(String cell) {
        List<Entry> entries = new ArrayList<>();
        for (String part : splitValues(cell)) {
            int colon = part.indexOf(':');
            if (colon > 0 && !part.substring(0, colon).isBlank() && part.substring(0, colon).matches("[\\p{L} ]+")) {
                entries.add(new Entry(labelOf(List.of(part.substring(0, colon))), part.substring(colon + 1).strip()));
            } else {
                entries.add(new Entry("other", part));
            }
        }
        return entries;
    }

    /** Tags separated by ";" or Google's ":::". Google's own groups ("* myContacts") are skipped, but "* starred" stars it. */
    private static void readTags(Draft draft, String cell) {
        for (String tag : splitValues(cell)) {
            if (tag.startsWith("*")) {
                draft.favorite = draft.favorite || tag.substring(1).strip().equalsIgnoreCase("starred");
            } else {
                draft.tags.add(tag);
            }
        }
    }

    private static List<String> splitValues(String cell) {
        return MULTI_VALUE.splitAsStream(cell).map(String::strip).filter(value -> !value.isEmpty()).toList();
    }

    private static boolean isTrue(String value) {
        return TRUE_WORDS.contains(value.strip().toLowerCase(Locale.ROOT));
    }

    // vCard -------------------------------------------------------------------------------------------------

    private List<Draft> readVCards(String text) {
        List<VCard.Card> cards = VCard.parse(text);
        List<Draft> drafts = new ArrayList<>();
        for (int i = 0; i < cards.size(); i++) {
            drafts.add(readCard("Contact " + (i + 1), cards.get(i)));
        }
        return drafts;
    }

    private static Draft readCard(String location, VCard.Card card) {
        Draft draft = new Draft(location);
        card.first("N").map(VCard.Property::parts).ifPresent(parts -> {
            draft.lastName = blankToNull(parts.getFirst());
            draft.firstName = parts.size() > 1 ? blankToNull(parts.get(1)) : null;
        });
        card.first("FN").ifPresent(fn -> draft.fullName = blankToNull(fn.text()));
        card.first("ORG").ifPresent(org -> draft.company = blankToNull(org.parts().getFirst()));
        card.first("BDAY").ifPresent(bday -> draft.birthday = blankToNull(bday.text()));
        card.first("ADR").ifPresent(adr -> draft.address = blankToNull(String.join(", ", nonBlank(adr.parts()))));
        card.all("NOTE").forEach(note -> draft.notes.add(note.text()));
        card.all("CATEGORIES").forEach(categories -> draft.tags.addAll(nonBlank(categories.list())));
        card.first(VCARD_FAVORITE).ifPresent(p -> draft.favorite = isTrue(p.text()));
        card.first(VCARD_EMERGENCY).ifPresent(p -> draft.emergency = isTrue(p.text()));

        for (VCard.Property tel : preferredFirst(card.all("TEL"))) {
            List<String> types = tel.types();
            if (types.contains("fax") || types.contains("pager")) {
                continue;
            }
            String value = tel.text().strip().replaceFirst("(?i)^tel:", "");
            draft.phones.add(new Entry(labelOf(types), value));
        }
        for (VCard.Property email : preferredFirst(card.all("EMAIL"))) {
            draft.emails.add(new Entry(labelOf(email.types()), email.text().strip().replaceFirst("(?i)^mailto:", "")));
        }
        return draft;
    }

    /** The phone number or email marked as preferred comes first, so it becomes the contact's main one. */
    private static List<VCard.Property> preferredFirst(List<VCard.Property> properties) {
        return properties.stream()
                .sorted(Comparator.comparing(property -> !(property.types().contains("pref")
                        || property.params().containsKey("PREF"))))
                .toList();
    }

    // Checking a contact ------------------------------------------------------------------------------------

    /** A contact that passed the checks: the request to create it, its tags (by name) and whether it's starred. */
    record Checked(ContactRequest request, List<String> tagNames, boolean favorite) {
    }

    /** Thrown by {@link #check} with the reason a contact can't be imported. */
    static final class Rejected extends RuntimeException {
        Rejected(String message) {
            super(message);
        }
    }

    /**
     * Turns a draft into a contact request, or rejects it. Things that can be left out without losing the
     * contact (an invalid second phone number, a birthday without a year, ...) are left out and noted in the
     * draft's warnings.
     */
    Checked check(Draft draft) {
        ContactRequest request = new ContactRequest();
        setNames(draft, request);

        List<String> phones = validPhones(draft);
        if (phones.isEmpty()) {
            throw new Rejected(draft.phones.isEmpty() ? "Has no phone number" : "Has no valid phone number");
        }
        request.setPhone(phones.getFirst());
        request.setAdditionalPhones(extras(draft, phones, "phone numbers").stream()
                .map(value -> new PhoneEntryRequest(labelFor(draft.phones, value), value))
                .toList());

        List<String> emails = validEmails(draft);
        request.setEmail(emails.isEmpty() ? null : emails.getFirst());
        request.setAdditionalEmails(extras(draft, emails, "emails").stream()
                .map(value -> new EmailEntryRequest(labelFor(draft.emails, value), value))
                .toList());

        request.setCompany(shortened(draft, draft.company, MAX_COMPANY, "Company"));
        request.setAddress(shortened(draft, draft.address, MAX_ADDRESS, "Address"));
        request.setNotes(shortened(draft, blankToNull(String.join("\n\n", draft.notes).strip()), MAX_NOTES, "Notes"));
        request.setBirthday(birthday(draft));
        request.setEmergency(draft.emergency);

        // A safety net: everything above should already keep the request within the API's rules.
        Set<ConstraintViolation<ContactRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            String message = violations.stream()
                    .map(ConstraintViolation::getMessage)
                    .sorted()
                    .findFirst()
                    .orElse("isn't valid");
            throw new Rejected("Couldn't be imported: " + message);
        }
        return new Checked(request, tagNames(draft), draft.favorite);
    }

    /** First and last name; a full name ("Ali Raza Khan") is split at its last space. The company if no name. */
    private static void setNames(Draft draft, ContactRequest request) {
        String first = blankToNull(draft.firstName);
        String last = blankToNull(draft.lastName);
        if (first == null && last == null && draft.fullName != null) {
            String full = collapseSpaces(draft.fullName);
            int space = full.lastIndexOf(' ');
            first = space < 0 ? full : full.substring(0, space);
            last = space < 0 ? null : full.substring(space + 1);
        }
        if (first == null) {
            first = last != null ? last : blankToNull(draft.company);
            last = last != null && first.equals(last) ? null : last;
        }
        if (first == null) {
            throw new Rejected("Has no name");
        }
        if (first.length() > MAX_NAME || (last != null && last.length() > MAX_NAME)) {
            throw new Rejected("Name is longer than " + MAX_NAME + " characters");
        }
        request.setFirstName(first);
        request.setLastName(last);
    }

    /** The valid, different phone numbers in order; invalid ones are left out with a warning. */
    private static List<String> validPhones(Draft draft) {
        List<String> valid = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Entry phone : draft.phones) {
            String value = phone.value().strip();
            if (!isValidPhone(value)) {
                draft.warnings.add("Left out \"" + value + "\": not a valid phone number");
            } else if (seen.add(value.replaceAll("\\D", ""))) {
                valid.add(value);
            }
        }
        return valid;
    }

    /** The same rule as the Add Contact form: 7 to 15 digits, at most 20 characters with spaces and dashes. */
    static boolean isValidPhone(String value) {
        if (value.length() > 20 || !PHONE_CHARACTERS.matcher(value).matches()) {
            return false;
        }
        int digits = value.replaceAll("\\D", "").length();
        return digits >= 7 && digits <= 15;
    }

    private static List<String> validEmails(Draft draft) {
        List<String> valid = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Entry email : draft.emails) {
            String value = email.value().strip();
            if (value.length() > MAX_EMAIL || !EMAIL.matcher(value).matches()) {
                draft.warnings.add("Left out \"" + value + "\": not a valid email");
            } else if (seen.add(value.toLowerCase(Locale.ROOT))) {
                valid.add(value);
            }
        }
        return valid;
    }

    /** All but the first, up to the limit; any more are left out with a warning. */
    private static List<String> extras(Draft draft, List<String> values, String noun) {
        if (values.size() <= 1) {
            return List.of();
        }
        List<String> extras = values.subList(1, values.size());
        if (extras.size() > ContactRequest.MAX_ADDITIONAL) {
            draft.warnings.add("Only the first " + (ContactRequest.MAX_ADDITIONAL + 1) + " " + noun + " were kept");
            extras = extras.subList(0, ContactRequest.MAX_ADDITIONAL);
        }
        return extras;
    }

    private static String labelFor(List<Entry> entries, String value) {
        return entries.stream()
                .filter(entry -> entry.value().strip().equals(value))
                .map(Entry::label)
                .filter(label -> label != null)
                .findFirst()
                .orElse("other");
    }

    private static String shortened(Draft draft, String value, int max, String what) {
        String trimmed = blankToNull(value);
        if (trimmed != null && trimmed.length() > max) {
            draft.warnings.add("Shortened the " + what.toLowerCase(Locale.ROOT) + " to " + max + " characters");
            return trimmed.substring(0, max).strip();
        }
        return trimmed;
    }

    /**
     * The birthday, from "1990-05-14", "19900514" or "1990-05-14T00:00:00". Others (such as "--05-14", a
     * birthday without a year) are left out with a warning, as are dates in the future or before 1900.
     */
    private static LocalDate birthday(Draft draft) {
        String value = blankToNull(draft.birthday);
        if (value == null) {
            return null;
        }
        String text = value.matches("\\d{8}") ? value.substring(0, 4) + "-" + value.substring(4, 6) + "-"
                + value.substring(6) : value.length() > 10 && value.matches("\\d{4}-\\d{2}-\\d{2}[T ].*")
                ? value.substring(0, 10) : value;
        try {
            LocalDate date = LocalDate.parse(text);
            if (date.getYear() >= MIN_BIRTHDAY_YEAR && !date.isAfter(LocalDate.now())) {
                return date;
            }
        } catch (DateTimeParseException ignored) {
            // Reported below.
        }
        draft.warnings.add("Left out the birthday \"" + value + "\": it needs to be a full date (year-month-day) "
                + "that isn't in the future");
        return null;
    }

    /** Tag names: spaces tidied, no copies (ignoring case), at most 20; overly long names are left out. */
    private static List<String> tagNames(Draft draft) {
        Map<String, String> names = new LinkedHashMap<>();
        for (String raw : draft.tags) {
            String name = collapseSpaces(raw);
            if (name.isEmpty()) {
                continue;
            }
            if (name.length() > MAX_TAG_NAME) {
                draft.warnings.add("Left out the tag \"" + name + "\": tag names can be at most "
                        + MAX_TAG_NAME + " characters");
                continue;
            }
            names.putIfAbsent(key(name), name);
        }
        List<String> list = new ArrayList<>(names.values());
        if (list.size() > ContactRequest.MAX_TAGS) {
            draft.warnings.add("Only the first " + ContactRequest.MAX_TAGS + " tags were kept");
            list = list.subList(0, ContactRequest.MAX_TAGS);
        }
        return list;
    }

    // Duplicates --------------------------------------------------------------------------------------------

    /**
     * Finds contacts with the same main phone number (digits only) or main email (ignoring case), among the
     * user's contacts and those accepted earlier from the same file: the same rule as adding one by hand.
     */
    static final class DuplicateFinder {
        private final Map<String, String> byPhone = new HashMap<>();
        private final Map<String, String> byEmail = new HashMap<>();

        DuplicateFinder(List<Contact> existing) {
            for (Contact contact : existing) {
                String name = ContactExportService.displayCase(
                        String.join(" ", nonBlank(contact.getFirstName(), contact.getLastName())));
                String digits = digits(contact.getPhone());
                if (!digits.isEmpty()) {
                    byPhone.putIfAbsent(digits, name);
                }
                if (contact.getEmail() != null && !contact.getEmail().isBlank()) {
                    byEmail.putIfAbsent(contact.getEmail().toLowerCase(Locale.ROOT), name);
                }
            }
        }

        /** Why it's a duplicate ("Same phone number as Ali Khan"), or null if it isn't one. */
        String find(Checked checked) {
            String phoneMatch = byPhone.get(digits(checked.request().getPhone()));
            if (phoneMatch != null) {
                return "Same phone number as " + phoneMatch;
            }
            String email = checked.request().getEmail();
            String emailMatch = email == null ? null : byEmail.get(email.toLowerCase(Locale.ROOT));
            return emailMatch == null ? null : "Same email as " + emailMatch;
        }

        /** Later contacts in the file are compared with this one too. */
        void remember(Checked checked) {
            ContactRequest request = checked.request();
            String name = "an earlier contact in this file ("
                    + String.join(" ", nonBlank(request.getFirstName(), request.getLastName())) + ")";
            byPhone.putIfAbsent(digits(request.getPhone()), name);
            if (request.getEmail() != null) {
                byEmail.putIfAbsent(request.getEmail().toLowerCase(Locale.ROOT), name);
            }
        }

        private static String digits(String phone) {
            return phone == null ? "" : phone.replaceAll("\\D", "");
        }
    }

    // Small helpers -----------------------------------------------------------------------------------------

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static List<String> nonBlank(String... values) {
        return nonBlank(java.util.Arrays.asList(values));
    }

    private static List<String> nonBlank(List<String> values) {
        return values.stream().filter(value -> value != null && !value.isBlank()).map(String::strip).toList();
    }
}

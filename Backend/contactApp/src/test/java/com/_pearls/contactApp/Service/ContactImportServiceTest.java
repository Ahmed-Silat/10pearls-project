package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ImportIssueDto;
import com._pearls.contactApp.Dto.ImportResultDto;
import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.ContactDetail;
import com._pearls.contactApp.Model.Tag;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.ContactRepo;
import com._pearls.contactApp.Repo.TagRepo;
import com._pearls.contactApp.Repo.UserRepo;
import jakarta.validation.Validation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ContactImportServiceTest {

    @Mock
    private ContactRepo contactRepo;

    @Mock
    private UserRepo userRepo;

    @Mock
    private TagRepo tagRepo;

    private ContactImportService importService;
    private User owner;
    private final List<Contact> existing = new ArrayList<>();
    private final List<Tag> existingTags = new ArrayList<>();

    @BeforeEach
    void setUp() {
        ContactService contactService = new ContactService(contactRepo, userRepo, tagRepo);
        importService = new ContactImportService(contactService, contactRepo, tagRepo, userRepo,
                Validation.buildDefaultValidatorFactory().getValidator());
        owner = User.builder().id(1L).email("owner@example.com").build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.findByUser_IdOrderByFirstNameAscLastNameAscIdAsc(1L)).thenReturn(existing);
        when(tagRepo.findByUser_Id(1L)).thenReturn(existingTags);
        when(tagRepo.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
    }

    private ImportResultDto importText(String fileName, String text, boolean dryRun, boolean allowDuplicates) {
        return importService.importContacts(1L, fileName, text.getBytes(StandardCharsets.UTF_8), dryRun,
                allowDuplicates);
    }

    /** The contacts handed to saveAll by a real (not dry-run) import. */
    @SuppressWarnings("unchecked")
    private List<Contact> saved() {
        ArgumentCaptor<List<Contact>> captor = ArgumentCaptor.forClass(List.class);
        verify(contactRepo).saveAll(captor.capture());
        return captor.getValue();
    }

    private static List<String> messages(List<ImportIssueDto> issues) {
        return issues.stream().map(issue -> issue.location() + ": " + issue.message()).toList();
    }

    // Round trip --------------------------------------------------------------------------------------------

    private Contact richContact() {
        Tag family = Tag.builder().id(5L).name("Family").color("blue").user(owner).build();
        return Contact.builder()
                .id(10L).firstName("ali").lastName("khan").phone("0300 1234567").email("ali@example.com")
                .company("10Pearls, Inc").birthday(LocalDate.of(1990, 5, 14)).address("12 Main St, Karachi")
                .notes("Likes tea.\nCall after 5.")
                .additionalPhones(new ArrayList<>(List.of(new ContactDetail("work", "021 111 2222"))))
                .additionalEmails(new ArrayList<>(List.of(new ContactDetail("home", "ali@home.com"))))
                .favorite(true).emergency(true)
                .tags(new HashSet<>(Set.of(family)))
                .user(owner)
                .build();
    }

    private void assertSameAsRichContact(Contact contact) {
        assertThat(contact.getFirstName()).isEqualTo("ali");
        assertThat(contact.getLastName()).isEqualTo("khan");
        assertThat(contact.getPhone()).isEqualTo("0300 1234567");
        assertThat(contact.getEmail()).isEqualTo("ali@example.com");
        assertThat(contact.getCompany()).isEqualTo("10Pearls, Inc");
        assertThat(contact.getBirthday()).isEqualTo(LocalDate.of(1990, 5, 14));
        assertThat(contact.getAddress()).isEqualTo("12 Main St, Karachi");
        assertThat(contact.getNotes()).isEqualTo("Likes tea.\nCall after 5.");
        assertThat(contact.getAdditionalPhones()).containsExactly(new ContactDetail("work", "021 111 2222"));
        assertThat(contact.getAdditionalEmails()).containsExactly(new ContactDetail("home", "ali@home.com"));
        assertThat(contact.isFavorite()).isTrue();
        assertThat(contact.isEmergency()).isTrue();
        assertThat(contact.getTags()).extracting(Tag::getName).containsExactly("Family");
        assertThat(contact.getUser()).isEqualTo(owner);
    }

    @Test
    void ownCsvExport_importsBackTheSame_andCreatesTheMissingTag() {
        String csv = ContactExportService.toCsv(List.of(richContact()));

        ImportResultDto result = importText("contacts.csv", csv, false, false);

        assertThat(result.imported()).isEqualTo(1);
        assertThat(result.newTags()).containsExactly("Family");
        assertThat(result.problems()).isEmpty();
        assertThat(result.warnings()).isEmpty();
        assertSameAsRichContact(saved().getFirst());
    }

    @Test
    void ownVCardExport_importsBackTheSame_usingTheExistingTag() {
        existingTags.add(Tag.builder().id(5L).name("family").color("red").user(owner).build());
        String vcf = ContactExportService.toVCard(List.of(richContact()));

        ImportResultDto result = importText("contacts.vcf", vcf, false, false);

        assertThat(result.imported()).isEqualTo(1);
        assertThat(result.newTags()).isEmpty();
        Contact contact = saved().getFirst();
        assertThat(contact.getTags()).extracting(Tag::getId).containsExactly(5L);
        contact.getTags().clear();
        contact.getTags().add(Tag.builder().name("Family").build());
        assertSameAsRichContact(contact);
        verify(tagRepo).saveAll(List.of());
    }

    // Other apps --------------------------------------------------------------------------------------------

    @Test
    void googleContactsCsv() {
        String csv = """
                First Name,Middle Name,Last Name,Organization Name,Birthday,Notes,Labels,E-mail 1 - Label,E-mail 1 - Value,Phone 1 - Label,Phone 1 - Value,Phone 2 - Label,Phone 2 - Value
                Sara,,Ahmed,Acme,1992-03-04,Met in Lahore,* myContacts ::: * starred ::: Work,* Home,sara@home.com,Work,021 555 6666,Mobile,0333 1234567 ::: 0345 7654321
                """;

        ImportResultDto result = importText("contacts.csv", csv, false, false);

        assertThat(result.imported()).isEqualTo(1);
        assertThat(result.newTags()).containsExactly("Work");
        Contact sara = saved().getFirst();
        assertThat(sara.getFirstName()).isEqualTo("sara");
        assertThat(sara.getCompany()).isEqualTo("Acme");
        assertThat(sara.getBirthday()).isEqualTo(LocalDate.of(1992, 3, 4));
        assertThat(sara.getPhone()).isEqualTo("021 555 6666");
        assertThat(sara.getAdditionalPhones()).containsExactly(
                new ContactDetail("mobile", "0333 1234567"), new ContactDetail("mobile", "0345 7654321"));
        assertThat(sara.getEmail()).isEqualTo("sara@home.com");
        assertThat(sara.isFavorite()).isTrue();
    }

    @Test
    void outlookCsv_withSemicolons_andAFullNameOnly() {
        String csv = "Name;Mobile Phone;Business Phone;Home Fax;E-mail Address;E-mail 2 Address;Company\n"
                + "Ali Raza Khan;0300 1234567;021 111 2222;021 999 9999;ali@x.com;ali@y.com;Acme\n";

        ImportResultDto result = importText("outlook.csv", csv, false, false);

        assertThat(result.imported()).isEqualTo(1);
        Contact ali = saved().getFirst();
        assertThat(ali.getFirstName()).isEqualTo("ali raza");
        assertThat(ali.getLastName()).isEqualTo("khan");
        assertThat(ali.getPhone()).isEqualTo("0300 1234567");
        // The fax number is not a phone to call.
        assertThat(ali.getAdditionalPhones()).containsExactly(new ContactDetail("work", "021 111 2222"));
        assertThat(ali.getAdditionalEmails()).containsExactly(new ContactDetail("other", "ali@y.com"));
    }

    @Test
    void oldAndroidVCard_withQuotedPrintableNames() {
        String vcf = String.join("\r\n",
                "BEGIN:VCARD",
                "VERSION:2.1",
                "N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;=D9=85=D8=AD=D9=85=D8=AF;;;",
                "FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D9=85=D8=AD=D9=85=D8=AF",
                "TEL;HOME:042-333-4444",
                "TEL;CELL;PREF:0300-1234567",
                "TEL;FAX:042-000-0000",
                "END:VCARD",
                "");

        ImportResultDto result = importText("00001.vcf", vcf, false, false);

        assertThat(result.imported()).isEqualTo(1);
        Contact contact = saved().getFirst();
        assertThat(contact.getFirstName()).isEqualTo("محمد");
        assertThat(contact.getPhone()).isEqualTo("0300-1234567");
        assertThat(contact.getAdditionalPhones()).containsExactly(new ContactDetail("home", "042-333-4444"));
    }

    @Test
    void aFileThatIsNotUtf8_isReadAsWindows1252() {
        byte[] content = "First Name,Phone\nJosé,0300 1234567\n".getBytes(Charset.forName("windows-1252"));

        importService.importContacts(1L, "old.csv", content, false, false);

        assertThat(saved().getFirst().getFirstName()).isEqualTo("josé");
    }

    // Problems and warnings ---------------------------------------------------------------------------------

    @Test
    void contactsThatCantBeImported_areListedWithTheReason_andTheRestAreImported() {
        String csv = """
                First Name,Last Name,Phone,Email,Birthday
                Ali,Khan,0300 1234567,not-an-email,--05-14
                Bob,,,bob@example.com,
                ,,0311 7654321,,
                Zed,,12,,
                """;

        ImportResultDto result = importText("contacts.csv", csv, false, false);

        assertThat(result.found()).isEqualTo(4);
        assertThat(result.imported()).isEqualTo(1);
        assertThat(messages(result.problems())).containsExactly(
                "Row 3: Has no phone number",
                "Row 4: Has no name",
                "Row 5: Has no valid phone number");
        assertThat(result.problems().getFirst().name()).isEqualTo("Bob");
        assertThat(messages(result.warnings())).containsExactly(
                "Row 2: Left out \"not-an-email\": not a valid email",
                "Row 2: Left out the birthday \"--05-14\": it needs to be a full date (year-month-day) that isn't in the future");
        assertThat(saved()).hasSize(1);
    }

    @Test
    void aContactWithOnlyACompany_isNamedAfterIt() {
        importText("contacts.csv", "Company,Phone\nAcme Corp,021 111 2222\n", false, false);

        assertThat(saved().getFirst().getFirstName()).isEqualTo("acme corp");
    }

    @Test
    void longNotes_areShortened_withAWarning() {
        String csv = "First Name,Phone,Notes\nAli,0300 1234567," + "x".repeat(2500) + "\n";

        ImportResultDto result = importText("contacts.csv", csv, false, false);

        assertThat(saved().getFirst().getNotes()).hasSize(2000);
        assertThat(messages(result.warnings())).containsExactly("Row 2: Shortened the notes to 2000 characters");
    }

    // Duplicates --------------------------------------------------------------------------------------------

    @Test
    void duplicates_ofExistingContactsOrEarlierRows_areLeftOut() {
        existing.add(Contact.builder().id(1L).firstName("ali").lastName("khan").phone("0300-1234567")
                .email("old@example.com").user(owner).build());
        String csv = """
                First Name,Phone,Email
                Ali,03001234567,
                Sara,0311 1111111,sara@example.com
                Sara Again,0322 2222222,SARA@example.com
                Old,0333 3333333,old@example.com
                """;

        ImportResultDto result = importText("contacts.csv", csv, false, false);

        assertThat(result.imported()).isEqualTo(1);
        assertThat(messages(result.duplicates())).containsExactly(
                "Row 2: Same phone number as Ali Khan",
                "Row 4: Same email as an earlier contact in this file (Sara)",
                "Row 5: Same email as Ali Khan");
        assertThat(saved()).extracting(Contact::getFirstName).containsExactly("sara");
    }

    @Test
    void duplicates_canBeImportedAnyway() {
        existing.add(Contact.builder().id(1L).firstName("ali").phone("0300 1234567").user(owner).build());

        ImportResultDto result = importText("contacts.csv", "First Name,Phone\nAli,0300 1234567\n", false, true);

        assertThat(result.imported()).isEqualTo(1);
        assertThat(result.duplicates()).isEmpty();
        assertThat(saved()).hasSize(1);
    }

    // Dry run and bad files ---------------------------------------------------------------------------------

    @Test
    void dryRun_reportsTheSame_butSavesNothing() {
        ImportResultDto result = importText("contacts.csv", "First Name,Phone,Tags\nAli,0300 1234567,Family\n",
                true, false);

        assertThat(result.dryRun()).isTrue();
        assertThat(result.imported()).isEqualTo(1);
        assertThat(result.newTags()).containsExactly("Family");
        verify(contactRepo, never()).saveAll(any());
        verify(tagRepo, never()).saveAll(any());
    }

    @Test
    void anEmptyFile_isRejected() {
        assertThatThrownBy(() -> importText("contacts.csv", " \n", true, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(ContactImportService.EMPTY_FILE);
    }

    @Test
    void aCsvWithNoContactColumns_isRejected() {
        assertThatThrownBy(() -> importText("prices.csv", "Product,Price\nTea,100\n", true, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(ContactImportService.NOT_A_CONTACTS_FILE);
    }

    @Test
    void aCsvWithOnlyAHeader_hasNoContacts() {
        assertThatThrownBy(() -> importText("contacts.csv", "First Name,Phone\n", true, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(ContactImportService.NO_CONTACTS);
    }

    @Test
    void moreThan1000Contacts_isRejected() {
        StringBuilder csv = new StringBuilder("First Name,Phone\n");
        for (int i = 0; i < 1001; i++) {
            csv.append("Person ").append(i).append(",0300 ").append(1000000 + i).append('\n');
        }

        assertThatThrownBy(() -> importText("big.csv", csv.toString(), true, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("1001 contacts");
    }

    @Test
    void columnNames_areRecognised() {
        assertThat(ContactImportService.classify("First Name").role()).isEqualTo(ContactImportService.Role.FIRST);
        assertThat(ContactImportService.classify("E-mail Address"))
                .isEqualTo(new ContactImportService.Column(ContactImportService.Role.EMAIL, null, 0));
        assertThat(ContactImportService.classify("Home Phone 2"))
                .isEqualTo(new ContactImportService.Column(ContactImportService.Role.PHONE, "home", 0));
        assertThat(ContactImportService.classify("Phone 3 - Value"))
                .isEqualTo(new ContactImportService.Column(ContactImportService.Role.NUMBERED_PHONE_VALUE, null, 3));
        assertThat(ContactImportService.classify("Business Fax").role()).isEqualTo(ContactImportService.Role.IGNORED);
        assertThat(ContactImportService.classify("Shoe size").role()).isEqualTo(ContactImportService.Role.IGNORED);
    }
}

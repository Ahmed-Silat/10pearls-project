package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.ContactRequest;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.ExceptionHandling.DuplicateResourceException;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.ContactRepo;
import com._pearls.contactApp.Repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock
    private ContactRepo contactRepo;

    @Mock
    private UserRepo userRepo;

    @InjectMocks
    private ContactService contactService;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).email("owner@example.com").build();
    }

    private Contact contact(Long id, String firstName, User user) {
        return Contact.builder()
                .id(id)
                .firstName(firstName)
                .lastName("Doe")
                .email(firstName.toLowerCase() + "@example.com")
                .phone("0300")
                .address("Karachi")
                .user(user)
                .build();
    }

    @Test
    void getContactsByUserId_mapsPageMetadataCorrectly() {
        List<Contact> content = List.of(contact(10L, "Alice", owner), contact(11L, "Bob", owner));
        Page<Contact> page = new PageImpl<>(content, PageRequest.of(0, 2), 5);
        when(contactRepo.findAllByUser_Id(eq(1L), any(Pageable.class))).thenReturn(page);

        PaginationDto<ContactDto> result = contactService.getContactsByUserId(1L, null, "A-Z", 1, 2);

        assertThat(result.getContacts()).hasSize(2);
        assertThat(result.getContacts().get(0).getId()).isEqualTo(10L);
        assertThat(result.getContacts().get(0).getFirstName()).isEqualTo("Alice");
        assertThat(result.getTotalContacts()).isEqualTo(5);
        assertThat(result.getTotalPages()).isEqualTo(3);
        assertThat(result.getContactsPerPage()).isEqualTo(2);
        assertThat(result.getCurrentPage()).isEqualTo(1);
    }

    @Test
    void getContactsByUserId_usesAscendingSortByDefault() {
        Page<Contact> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        when(contactRepo.findAllByUser_Id(eq(1L), any(Pageable.class))).thenReturn(page);

        contactService.getContactsByUserId(1L, null, null, 1, 10);

        verify(contactRepo).findAllByUser_Id(eq(1L), org.mockito.ArgumentMatchers.argThat(p ->
                Sort.by(Sort.Direction.ASC, "firstName").and(Sort.by(Sort.Direction.ASC, "id")).equals(p.getSort())));
    }

    @Test
    void getContactsByUserId_zToA_stillBreaksTiesById() {
        // Without a tiebreaker, two "Ali"s can swap places between page loads and one gets shown twice.
        when(contactRepo.findAllByUser_Id(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        contactService.getContactsByUserId(1L, null, "Z-A", 1, 10);

        verify(contactRepo).findAllByUser_Id(eq(1L), org.mockito.ArgumentMatchers.argThat(p ->
                Sort.by(Sort.Direction.DESC, "firstName").and(Sort.by(Sort.Direction.ASC, "id")).equals(p.getSort())));
    }

    @Test
    void getContactsByUserId_capsHugePageSizes() {
        when(contactRepo.findAllByUser_Id(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));

        PaginationDto<ContactDto> result = contactService.getContactsByUserId(1L, null, null, 1, 10_000_000);

        verify(contactRepo).findAllByUser_Id(eq(1L), org.mockito.ArgumentMatchers.argThat(p ->
                p.getPageSize() == ContactService.MAX_PAGE_SIZE));
        assertThat(result.getContactsPerPage()).isEqualTo(ContactService.MAX_PAGE_SIZE);
    }

    @Test
    void getContactsByUserId_pageZeroOrNegative_isTreatedAsFirstPage() {
        when(contactRepo.findAllByUser_Id(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        PaginationDto<ContactDto> result = contactService.getContactsByUserId(1L, null, null, -3, 0);

        verify(contactRepo).findAllByUser_Id(eq(1L), org.mockito.ArgumentMatchers.argThat(p ->
                p.getPageNumber() == 0 && p.getPageSize() == 1));
        assertThat(result.getCurrentPage()).isEqualTo(1);
    }

    @Test
    void createContact_samePhoneInAnotherFormat_isRejected() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("John");
        request.setPhone("0300-123 4567");

        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.existsPhoneForUser(1L, "03001234567", 0L)).thenReturn(true);

        assertThatThrownBy(() -> contactService.createContact(1L, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage(ContactService.DUPLICATE_PHONE);
        verify(contactRepo, never()).save(any());
    }

    @Test
    void createContact_sameEmail_isRejected() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("John");
        request.setPhone("0300");
        request.setEmail(" John@Example.com ");

        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.existsByUser_IdAndEmailIgnoreCaseAndIdNot(1L, "john@example.com", 0L)).thenReturn(true);

        assertThatThrownBy(() -> contactService.createContact(1L, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage(ContactService.DUPLICATE_EMAIL);
    }

    @Test
    void createContact_withoutEmail_skipsTheEmailCheck() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("John");
        request.setPhone("0300");
        request.setEmail("");

        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        contactService.createContact(1L, request);

        verify(contactRepo, never()).existsByUser_IdAndEmailIgnoreCaseAndIdNot(any(), any(), any());
    }

    @Test
    void updateContact_keepingItsOwnPhone_isNotADuplicate() {
        Contact existing = contact(10L, "Alice", owner);
        ContactRequest request = new ContactRequest();
        request.setFirstName("Alice");
        request.setPhone("0300");

        when(contactRepo.findById(10L)).thenReturn(Optional.of(existing));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        contactService.updateContact(10L, 1L, request);

        // The contact being edited is excluded from the check.
        verify(contactRepo).existsPhoneForUser(1L, "0300", 10L);
        verify(contactRepo).save(existing);
    }

    @Test
    void getContactsByUserId_searchEscapesLikeWildcards() {
        Page<Contact> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        // Input "100%" must be escaped to the SQL pattern "100\%%" (literal %, then wildcard).
        when(contactRepo.searchByUserId(eq(1L), eq("100\\%%"), any(Pageable.class))).thenReturn(page);

        contactService.getContactsByUserId(1L, "100%", null, 1, 10);

        verify(contactRepo).searchByUserId(eq(1L), eq("100\\%%"), any(Pageable.class));
        verify(contactRepo, never()).findAllByUser_Id(any(), any());
    }

    @Test
    void getContactByIdAndUser_otherUsersContact_looksLikeItDoesNotExist() {
        User other = User.builder().id(2L).build();
        Contact foreign = contact(10L, "Alice", other);

        when(contactRepo.findById(10L)).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> contactService.getContactByIdAndUser(10L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getContactByIdAndUser_ownContact_returnsDto() {
        when(contactRepo.findById(10L)).thenReturn(Optional.of(contact(10L, "Alice", owner)));

        ContactDto result = contactService.getContactByIdAndUser(10L, 1L);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getFirstName()).isEqualTo("Alice");
        assertThat(result.getPhone()).isEqualTo("0300");
    }

    @Test
    void getContactByIdAndUser_unknownId_throwsNotFound() {
        when(contactRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.getContactByIdAndUser(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createContact_linksAuthenticatedUser() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setEmail("john@example.com");
        request.setPhone("0300");
        request.setAddress("Karachi");

        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto created = contactService.createContact(1L, request);

        assertThat(created.getFirstName()).isEqualTo("john");
        verify(contactRepo).save(org.mockito.ArgumentMatchers.argThat(saved -> saved.getUser() == owner));
    }

    @Test
    void createContact_trimsAndLowerCasesNameAndEmail() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("  John ");
        request.setLastName(" DOE  ");
        request.setEmail("  John@Example.COM ");
        request.setPhone(" 0300 ");
        request.setAddress(" Karachi ");

        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto created = contactService.createContact(1L, request);

        assertThat(created.getFirstName()).isEqualTo("john");
        assertThat(created.getLastName()).isEqualTo("doe");
        assertThat(created.getEmail()).isEqualTo("john@example.com");
        assertThat(created.getPhone()).isEqualTo("0300");
        assertThat(created.getAddress()).isEqualTo("Karachi");
    }

    @Test
    void createContact_withOnlyRequiredFields_savesOptionalOnesAsNull() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("John");
        request.setPhone("0300");

        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto created = contactService.createContact(1L, request);

        assertThat(created.getFirstName()).isEqualTo("john");
        assertThat(created.getLastName()).isNull();
        assertThat(created.getEmail()).isNull();
        assertThat(created.getAddress()).isNull();
    }

    @Test
    void createContact_unknownUser_throwsNotFound() {
        ContactRequest request = new ContactRequest();
        when(userRepo.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.createContact(404L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateContact_updatesOwnedContact() {
        Contact existing = contact(10L, "Old", owner);
        ContactRequest request = new ContactRequest();
        request.setFirstName(" Jane ");
        request.setLastName("Doe");
        request.setEmail(" Jane@Example.com ");
        request.setPhone("0301");
        request.setAddress("London");

        when(contactRepo.findById(10L)).thenReturn(Optional.of(existing));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto updated = contactService.updateContact(10L, 1L, request);

        assertThat(updated.getFirstName()).isEqualTo("jane");
        assertThat(updated.getLastName()).isEqualTo("doe");
        assertThat(updated.getEmail()).isEqualTo("jane@example.com");
        assertThat(existing.getUser()).isEqualTo(owner);
        verify(contactRepo).save(existing);
        verify(userRepo, never()).findById(any());
    }

    @Test
    void updateContact_otherUsersContact_looksLikeItDoesNotExist() {
        User other = User.builder().id(2L).build();
        Contact foreign = contact(10L, "Alice", other);

        when(contactRepo.findById(10L)).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> contactService.updateContact(10L, 1L, new ContactRequest()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteContact_deletesOwnedContact() {
        Contact existing = contact(10L, "Alice", owner);
        when(contactRepo.findById(10L)).thenReturn(Optional.of(existing));

        contactService.deleteContact(10L, 1L);

        verify(contactRepo).delete(existing);
        verify(contactRepo, never()).save(any());
    }

    @Test
    void deleteContact_unknownId_throwsNotFound() {
        when(contactRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.deleteContact(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
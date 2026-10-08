package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.ContactRequest;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.ExceptionHandling.ForbiddenException;
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
        owner = User.builder().id("user-1").email("owner@example.com").build();
    }

    private Contact contact(String id, String firstName, User user) {
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
        List<Contact> content = List.of(contact("c1", "Alice", owner), contact("c2", "Bob", owner));
        Page<Contact> page = new PageImpl<>(content, PageRequest.of(0, 2), 5);
        when(contactRepo.findAllByUser_Id(eq("user-1"), any(Pageable.class))).thenReturn(page);

        PaginationDto<ContactDto> result = contactService.getContactsByUserId("user-1", null, "A-Z", 1, 2);

        assertThat(result.getContacts()).hasSize(2);
        assertThat(result.getContacts().get(0).getId()).isEqualTo("c1");
        assertThat(result.getContacts().get(0).getFirstName()).isEqualTo("Alice");
        assertThat(result.getTotalContacts()).isEqualTo(5);
        assertThat(result.getTotalPages()).isEqualTo(3);
        assertThat(result.getContactsPerPage()).isEqualTo(2);
        assertThat(result.getCurrentPage()).isEqualTo(1);
    }

    @Test
    void getContactsByUserId_usesAscendingSortByDefault() {
        Page<Contact> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        when(contactRepo.findAllByUser_Id(eq("user-1"), any(Pageable.class))).thenReturn(page);

        contactService.getContactsByUserId("user-1", null, null, 1, 10);

        verify(contactRepo).findAllByUser_Id(eq("user-1"), org.mockito.ArgumentMatchers.argThat(p ->
                Sort.by(Sort.Direction.ASC, "firstName").equals(p.getSort())));
    }

    @Test
    void getContactsByUserId_searchEscapesLikeWildcards() {
        Page<Contact> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        // Input "100%" must be escaped to the SQL pattern "100\%%" (literal %, then wildcard).
        when(contactRepo.searchByUserId(eq("user-1"), eq("100\\%%"), any(Pageable.class))).thenReturn(page);

        contactService.getContactsByUserId("user-1", "100%", null, 1, 10);

        verify(contactRepo).searchByUserId(eq("user-1"), eq("100\\%%"), any(Pageable.class));
        verify(contactRepo, never()).findAllByUser_Id(any(), any());
    }

    @Test
    void getContactByIdAndUser_otherUsersContact_throwsForbidden() {
        User other = User.builder().id("user-2").build();
        Contact foreign = contact("c1", "Alice", other);

        when(contactRepo.findById("c1")).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> contactService.getContactByIdAndUser("c1", "user-1"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getContactByIdAndUser_ownContact_returnsDto() {
        when(contactRepo.findById("c1")).thenReturn(Optional.of(contact("c1", "Alice", owner)));

        ContactDto result = contactService.getContactByIdAndUser("c1", "user-1");

        assertThat(result.getId()).isEqualTo("c1");
        assertThat(result.getFirstName()).isEqualTo("Alice");
        assertThat(result.getPhone()).isEqualTo("0300");
    }

    @Test
    void getContactByIdAndUser_unknownId_throwsNotFound() {
        when(contactRepo.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.getContactByIdAndUser("missing", "user-1"))
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

        when(userRepo.findById("user-1")).thenReturn(Optional.of(owner));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto created = contactService.createContact("user-1", request);

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

        when(userRepo.findById("user-1")).thenReturn(Optional.of(owner));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto created = contactService.createContact("user-1", request);

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

        when(userRepo.findById("user-1")).thenReturn(Optional.of(owner));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto created = contactService.createContact("user-1", request);

        assertThat(created.getFirstName()).isEqualTo("john");
        assertThat(created.getLastName()).isNull();
        assertThat(created.getEmail()).isNull();
        assertThat(created.getAddress()).isNull();
    }

    @Test
    void createContact_unknownUser_throwsNotFound() {
        ContactRequest request = new ContactRequest();
        when(userRepo.findById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.createContact("ghost", request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateContact_updatesOwnedContact() {
        Contact existing = contact("c1", "Old", owner);
        ContactRequest request = new ContactRequest();
        request.setFirstName(" Jane ");
        request.setLastName("Doe");
        request.setEmail(" Jane@Example.com ");
        request.setPhone("0301");
        request.setAddress("London");

        when(contactRepo.findById("c1")).thenReturn(Optional.of(existing));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto updated = contactService.updateContact("c1", "user-1", request);

        assertThat(updated.getFirstName()).isEqualTo("jane");
        assertThat(updated.getLastName()).isEqualTo("doe");
        assertThat(updated.getEmail()).isEqualTo("jane@example.com");
        assertThat(existing.getUser()).isEqualTo(owner);
        verify(contactRepo).save(existing);
        verify(userRepo, never()).findById(any());
    }

    @Test
    void updateContact_otherUsersContact_throwsForbidden() {
        User other = User.builder().id("user-2").build();
        Contact foreign = contact("c1", "Alice", other);

        when(contactRepo.findById("c1")).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> contactService.updateContact("c1", "user-1", new ContactRequest()))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void deleteContact_deletesOwnedContact() {
        Contact existing = contact("c1", "Alice", owner);
        when(contactRepo.findById("c1")).thenReturn(Optional.of(existing));

        contactService.deleteContact("c1", "user-1");

        verify(contactRepo).delete(existing);
        verify(contactRepo, never()).save(any());
    }

    @Test
    void deleteContact_unknownId_throwsNotFound() {
        when(contactRepo.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.deleteContact("missing", "user-1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ContactCountsDto;
import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.DuplicateMatchDto;
import com._pearls.contactApp.Dto.ContactRequest;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.ExceptionHandling.DuplicateContactException;
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

import java.time.Instant;
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
        when(contactRepo.findForUser(eq(1L), eq(false), any(Pageable.class))).thenReturn(page);

        PaginationDto<ContactDto> result = contactService.getContactsByUserId(1L, null, "A-Z", 1, 2, "all");

        assertThat(result.getContacts()).hasSize(2);
        assertThat(result.getContacts().get(0).getId()).isEqualTo(10L);
        assertThat(result.getContacts().get(0).getFirstName()).isEqualTo("Alice");
        assertThat(result.getTotalContacts()).isEqualTo(5);
        assertThat(result.getTotalPages()).isEqualTo(3);
        assertThat(result.getContactsPerPage()).isEqualTo(2);
        assertThat(result.getCurrentPage()).isEqualTo(1);
    }

    @Test
    void setFavorite_starsOwnContact() {
        Contact existing = contact(10L, "Alice", owner);
        when(contactRepo.findById(10L)).thenReturn(Optional.of(existing));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto result = contactService.setFavorite(10L, 1L, true);

        assertThat(existing.isFavorite()).isTrue();
        assertThat(result.isFavorite()).isTrue();
    }

    @Test
    void setFavorite_canUnstar() {
        Contact existing = contact(10L, "Alice", owner);
        existing.setFavorite(true);
        when(contactRepo.findById(10L)).thenReturn(Optional.of(existing));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(contactService.setFavorite(10L, 1L, false).isFavorite()).isFalse();
    }

    @Test
    void setFavorite_otherUsersContact_looksLikeItDoesNotExist() {
        when(contactRepo.findById(10L)).thenReturn(Optional.of(contact(10L, "Alice", User.builder().id(2L).build())));

        assertThatThrownBy(() -> contactService.setFavorite(10L, 1L, true))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(contactRepo, never()).save(any());
    }

    @Test
    void editingAContact_keepsItsStar() {
        // ContactRequest has no favorite field, so saving edits must not unstar the contact.
        Contact existing = contact(10L, "Alice", owner);
        existing.setFavorite(true);
        ContactRequest request = new ContactRequest();
        request.setFirstName("Alicia");
        request.setPhone("0300");
        when(contactRepo.findById(10L)).thenReturn(Optional.of(existing));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(contactService.updateContact(10L, 1L, request).isFavorite()).isTrue();
    }

    @Test
    void getContactsByUserId_usesAscendingSortByDefault() {
        Page<Contact> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        when(contactRepo.findForUser(eq(1L), eq(false), any(Pageable.class))).thenReturn(page);

        contactService.getContactsByUserId(1L, null, null, 1, 10, "all");

        verify(contactRepo).findForUser(eq(1L), eq(false), org.mockito.ArgumentMatchers.argThat(p ->
                Sort.by(Sort.Direction.ASC, "firstName").and(Sort.by(Sort.Direction.ASC, "id")).equals(p.getSort())));
    }

    @Test
    void getContactsByUserId_doesNotPinFavoritesToTheTop() {
        // Favorites have their own page, so in All contacts a starred "Zara" stays after "Ali".
        when(contactRepo.findForUser(eq(1L), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        contactService.getContactsByUserId(1L, null, null, 1, 10, "all");

        verify(contactRepo).findForUser(eq(1L), eq(false), org.mockito.ArgumentMatchers.argThat(p ->
                p.getSort().getOrderFor("favorite") == null));
    }

    @Test
    void getContactsByUserId_zToA_stillBreaksTiesById() {
        // Without a tiebreaker, two "Ali"s can swap places between page loads and one gets shown twice.
        when(contactRepo.findForUser(eq(1L), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        contactService.getContactsByUserId(1L, null, "Z-A", 1, 10, "all");

        verify(contactRepo).findForUser(eq(1L), eq(false), org.mockito.ArgumentMatchers.argThat(p ->
                Sort.by(Sort.Direction.DESC, "firstName").and(Sort.by(Sort.Direction.ASC, "id")).equals(p.getSort())));
    }

    @Test
    void getContactsByUserId_capsHugePageSizes() {
        when(contactRepo.findForUser(eq(1L), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));

        PaginationDto<ContactDto> result = contactService.getContactsByUserId(1L, null, null, 1, 10_000_000, "all");

        verify(contactRepo).findForUser(eq(1L), eq(false), org.mockito.ArgumentMatchers.argThat(p ->
                p.getPageSize() == ContactService.MAX_PAGE_SIZE));
        assertThat(result.getContactsPerPage()).isEqualTo(ContactService.MAX_PAGE_SIZE);
    }

    @Test
    void getContactsByUserId_pageZeroOrNegative_isTreatedAsFirstPage() {
        when(contactRepo.findForUser(eq(1L), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        PaginationDto<ContactDto> result = contactService.getContactsByUserId(1L, null, null, -3, 0, "all");

        verify(contactRepo).findForUser(eq(1L), eq(false), org.mockito.ArgumentMatchers.argThat(p ->
                p.getPageNumber() == 0 && p.getPageSize() == 1));
        assertThat(result.getCurrentPage()).isEqualTo(1);
    }

    @Test
    void createContact_samePhoneInAnotherFormat_isRejected() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("John");
        request.setPhone("0300-123 4567");

        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.findPhoneMatches(1L, "03001234567", 0L)).thenReturn(List.of(contact(5L, "Zed", owner)));

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
        when(contactRepo.findTop5ByUser_IdAndEmailIgnoreCaseAndIdNotOrderByIdAsc(1L, "john@example.com", 0L)).thenReturn(List.of(contact(5L, "Zed", owner)));

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

        verify(contactRepo, never()).findTop5ByUser_IdAndEmailIgnoreCaseAndIdNotOrderByIdAsc(any(), any(), any());
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
        verify(contactRepo).findPhoneMatches(1L, "0300", 10L);
        verify(contactRepo).save(existing);
    }

    @Test
    void getContactsByUserId_searchEscapesLikeWildcards() {
        Page<Contact> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        // Input "100%" must be escaped to the SQL pattern "100\%%" (literal %, then wildcard).
        when(contactRepo.searchByUserId(eq(1L), eq("100\\%%"), eq(false), any(Pageable.class))).thenReturn(page);

        contactService.getContactsByUserId(1L, "100%", null, 1, 10, "all");

        verify(contactRepo).searchByUserId(eq(1L), eq("100\\%%"), eq(false), any(Pageable.class));
        verify(contactRepo, never()).findForUser(any(), org.mockito.ArgumentMatchers.anyBoolean(), any());
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
    void deleteContact_hidesItInsteadOfRemovingIt_soItCanBeUndone() {
        Contact existing = contact(10L, "Alice", owner);
        when(contactRepo.findById(10L)).thenReturn(Optional.of(existing));
        Instant before = Instant.now();

        contactService.deleteContact(10L, 1L);

        assertThat(existing.getDeletedAt()).isNotNull().isAfterOrEqualTo(before);
        verify(contactRepo).save(existing);
        verify(contactRepo, never()).delete(any(Contact.class));
    }

    @Test
    void deleteContact_unknownId_throwsNotFound() {
        when(contactRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.deleteContact(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private Contact deletedSecondsAgo(long seconds) {
        Contact deleted = contact(10L, "Alice", owner);
        deleted.setFavorite(true);
        deleted.setDeletedAt(Instant.now().minusSeconds(seconds));
        return deleted;
    }

    @Test
    void restoreContact_bringsItBackWithItsStar() {
        Contact deleted = deletedSecondsAgo(5);
        when(contactRepo.findDeletedByIdAndUserId(10L, 1L)).thenReturn(Optional.of(deleted));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactDto restored = contactService.restoreContact(10L, 1L, false);

        assertThat(deleted.getDeletedAt()).isNull();
        assertThat(restored.getId()).isEqualTo(10L);
        assertThat(restored.isFavorite()).isTrue();
    }

    @Test
    void restoreContact_after30Days_isNotFound() {
        Contact deleted = deletedSecondsAgo(ContactService.RETENTION.toSeconds() + 1);
        when(contactRepo.findDeletedByIdAndUserId(10L, 1L)).thenReturn(Optional.of(deleted));

        assertThatThrownBy(() -> contactService.restoreContact(10L, 1L, false))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(contactRepo, never()).save(any());
    }

    @Test
    void restoreContact_notDeletedOrSomeoneElses_isNotFound() {
        when(contactRepo.findDeletedByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.restoreContact(10L, 1L, false))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void restoreContact_whenTheSamePhoneWasAddedSince_isRejected() {
        Contact deleted = deletedSecondsAgo(5);
        when(contactRepo.findDeletedByIdAndUserId(10L, 1L)).thenReturn(Optional.of(deleted));
        when(contactRepo.findPhoneMatches(1L, "0300", 10L)).thenReturn(List.of(contact(5L, "Zed", owner)));

        assertThatThrownBy(() -> contactService.restoreContact(10L, 1L, false))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage(ContactService.DUPLICATE_PHONE);
        assertThat(deleted.getDeletedAt()).isNotNull();
    }

    @Test
    void purgeDeletedContacts_removesOnlyThoseOlderThan30Days() {
        Instant before = Instant.now();

        contactService.purgeDeletedContacts();

        verify(contactRepo).purgeDeletedBefore(org.mockito.ArgumentMatchers.argThat(cutoff ->
                !cutoff.isBefore(before.minus(ContactService.RETENTION))
                        && !cutoff.isAfter(Instant.now().minus(ContactService.RETENTION))));
    }

    @Test
    void retentionIs30Days() {
        assertThat(ContactService.RETENTION).isEqualTo(java.time.Duration.ofDays(30));
    }

    @Test
    void getRecentlyDeleted_listsDeletedContactsWithTheirPermanentDeleteDate() {
        Contact deleted = deletedSecondsAgo(60);
        when(contactRepo.findDeletedByUserId(eq(1L), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(deleted), PageRequest.of(0, 20), 1));

        PaginationDto<ContactDto> result = contactService.getRecentlyDeleted(1L, 1);

        ContactDto dto = result.getContacts().get(0);
        assertThat(dto.getDeletedAt()).isEqualTo(deleted.getDeletedAt().toString());
        assertThat(dto.getDeletesPermanentlyAt())
                .isEqualTo(deleted.getDeletedAt().plus(ContactService.RETENTION).toString());
        assertThat(result.getTotalContacts()).isEqualTo(1);
        // Only contacts deleted within the last 30 days are asked for.
        verify(contactRepo).findDeletedByUserId(eq(1L),
                org.mockito.ArgumentMatchers.argThat(cutoff ->
                        !cutoff.isAfter(Instant.now().minus(ContactService.RETENTION))),
                org.mockito.ArgumentMatchers.argThat(p -> p.getPageNumber() == 0
                        && p.getPageSize() == ContactService.RECENTLY_DELETED_PAGE_SIZE));
    }

    @Test
    void liveContacts_haveNoDeletionDates() {
        when(contactRepo.findById(10L)).thenReturn(Optional.of(contact(10L, "Alice", owner)));

        ContactDto dto = contactService.getContactByIdAndUser(10L, 1L);

        assertThat(dto.getDeletedAt()).isNull();
        assertThat(dto.getDeletesPermanentlyAt()).isNull();
    }

    @Test
    void deletePermanently_removesAContactInRecentlyDeleted() {
        when(contactRepo.deleteDeletedByIdAndUserId(10L, 1L)).thenReturn(1);

        contactService.deletePermanently(10L, 1L);

        verify(contactRepo).deleteDeletedByIdAndUserId(10L, 1L);
    }

    @Test
    void deletePermanently_contactNotInRecentlyDeleted_isNotFound() {
        // Covers live contacts, other users' contacts and ones already gone: the query matches none of them.
        when(contactRepo.deleteDeletedByIdAndUserId(10L, 1L)).thenReturn(0);

        assertThatThrownBy(() -> contactService.deletePermanently(10L, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(ContactService.NO_LONGER_RESTORABLE);
    }

    @Test
    void favoritesFilter_listsOnlyStarredContacts() {
        when(contactRepo.findForUser(eq(1L), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        contactService.getContactsByUserId(1L, null, null, 1, 10, "favorites");

        verify(contactRepo).findForUser(eq(1L), eq(true), any(Pageable.class));
    }

    @Test
    void favoritesFilter_alsoAppliesToSearch() {
        when(contactRepo.searchByUserId(eq(1L), eq("al%"), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        contactService.getContactsByUserId(1L, "al", null, 1, 10, "favorites");

        verify(contactRepo).searchByUserId(eq(1L), eq("al%"), eq(true), any(Pageable.class));
    }

    @Test
    void unknownFilter_listsEveryContact() {
        when(contactRepo.findForUser(eq(1L), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        contactService.getContactsByUserId(1L, null, null, 1, 10, "something-else");

        verify(contactRepo).findForUser(eq(1L), eq(false), any(Pageable.class));
    }

    @Test
    void getCounts_returnsTheNumberInEachSidebarSection() {
        when(contactRepo.countByUser_Id(1L)).thenReturn(24L);
        when(contactRepo.countByUser_IdAndFavoriteTrue(1L)).thenReturn(5L);
        when(contactRepo.countDeletedByUserId(eq(1L), any(Instant.class))).thenReturn(3L);

        assertThat(contactService.getCounts(1L)).isEqualTo(new ContactCountsDto(24, 5, 3));
    }

    @Test
    void createContact_duplicate_namesTheMatchingContacts() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("John");
        request.setPhone("0300-1234567");
        request.setEmail("john@example.com");
        Contact ali = contact(5L, "Ali", owner);
        Contact sara = contact(6L, "Sara", owner);
        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.findPhoneMatches(1L, "03001234567", 0L)).thenReturn(List.of(ali));
        when(contactRepo.findTop5ByUser_IdAndEmailIgnoreCaseAndIdNotOrderByIdAsc(1L, "john@example.com", 0L))
                .thenReturn(List.of(sara));

        assertThatThrownBy(() -> contactService.createContact(1L, request))
                .isInstanceOf(DuplicateContactException.class)
                .hasMessage(ContactService.DUPLICATE_PHONE)
                .satisfies(ex -> assertThat(((DuplicateContactException) ex).getDuplicates()).containsExactly(
                        new DuplicateMatchDto(5L, "Ali", "Doe", "phone"),
                        new DuplicateMatchDto(6L, "Sara", "Doe", "email")));
        verify(contactRepo, never()).save(any());
    }

    @Test
    void createContact_saveAnyway_skipsTheDuplicateCheck() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("John");
        request.setPhone("0300-1234567");
        request.setAllowDuplicate(true);
        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        contactService.createContact(1L, request);

        verify(contactRepo, never()).findPhoneMatches(any(), any(), org.mockito.ArgumentMatchers.anyLong());
        verify(contactRepo).save(any(Contact.class));
    }

    @Test
    void updateContact_saveAnyway_skipsTheDuplicateCheck() {
        Contact existing = contact(10L, "Alice", owner);
        ContactRequest request = new ContactRequest();
        request.setFirstName("Alice");
        request.setPhone("0300");
        request.setAllowDuplicate(true);
        when(contactRepo.findById(10L)).thenReturn(Optional.of(existing));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        contactService.updateContact(10L, 1L, request);

        verify(contactRepo, never()).findPhoneMatches(any(), any(), org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void restoreContact_restoreAnyway_skipsTheDuplicateCheck() {
        Contact deleted = deletedSecondsAgo(5);
        when(contactRepo.findDeletedByIdAndUserId(10L, 1L)).thenReturn(Optional.of(deleted));
        when(contactRepo.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        contactService.restoreContact(10L, 1L, true);

        assertThat(deleted.getDeletedAt()).isNull();
        verify(contactRepo, never()).findPhoneMatches(any(), any(), org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void findDuplicates_noPhoneOrEmail_findsNothing() {
        assertThat(contactService.findDuplicates(1L, 0L, "  ", "")).isEmpty();
        verify(contactRepo, never()).findPhoneMatches(any(), any(), org.mockito.ArgumentMatchers.anyLong());
        verify(contactRepo, never()).findTop5ByUser_IdAndEmailIgnoreCaseAndIdNotOrderByIdAsc(any(), any(), any());
    }

    @Test
    void findDuplicates_comparesEmailsIgnoringCaseAndSpaces() {
        when(contactRepo.findTop5ByUser_IdAndEmailIgnoreCaseAndIdNotOrderByIdAsc(1L, "ali@example.com", 7L))
                .thenReturn(List.of(contact(5L, "Ali", owner)));

        assertThat(contactService.findDuplicates(1L, 7L, null, "  Ali@Example.COM "))
                .containsExactly(new DuplicateMatchDto(5L, "Ali", "Doe", "email"));
    }
}
package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ContactCountsDto;
import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.DuplicateMatchDto;
import com._pearls.contactApp.Dto.ContactRequest;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.ExceptionHandling.DuplicateContactException;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.ContactRepo;
import com._pearls.contactApp.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static com._pearls.contactApp.Util.TextUtils.normalize;
import static com._pearls.contactApp.Util.TextUtils.trim;

@Service
@Slf4j
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepo contactRepo;
    private final UserRepo userRepo;

    private static final String SORT_AZ = "A-Z";
    private static final String SORT_ZA = "Z-A";

    static final int MAX_PAGE_SIZE = 100;
    static final String FILTER_FAVORITES = "favorites";
    static final String FILTER_EMERGENCY = "emergency";
    static final String DUPLICATE_PHONE = "You already have a contact with this phone number";
    static final String DUPLICATE_EMAIL = "You already have a contact with this email";

    /** How long a deleted contact stays in Recently deleted, restorable, before it is removed for good. */
    static final Duration RETENTION = Duration.ofDays(30);

    static final int RECENTLY_DELETED_PAGE_SIZE = 20;
    static final String NO_LONGER_RESTORABLE = "This contact is no longer in Recently deleted";

    /** Used as "no contact to exclude" when checking a new contact for duplicates; real ids start at 1. */
    private static final long NEW_CONTACT = 0L;

    /**
     * One page of the user's contacts. {@code filter} picks the sidebar section: {@value #FILTER_FAVORITES} for
     * starred contacts only, {@value #FILTER_EMERGENCY} for emergency contacts only, anything else (normally "all")
     * for every contact.
     */
    @Transactional(readOnly = true)
    public PaginationDto<ContactDto> getContactsByUserId(Long userId, String search, String sortBy, int page, int size,
                                                         String filter) {
        boolean favoritesOnly = FILTER_FAVORITES.equalsIgnoreCase(filter);
        boolean emergencyOnly = FILTER_EMERGENCY.equalsIgnoreCase(filter);
        // Out-of-range values are clamped rather than rejected: a huge size would load every contact at once,
        // and page 0 or below would otherwise make PageRequest throw.
        page = Math.max(page, 1);
        size = Math.clamp(size, 1, MAX_PAGE_SIZE);

        // Plain name order; starred contacts are not pinned, as they have their own Favorites page. Contacts with
        // the same first name are ordered by id, so they keep the same order on every page load and none is
        // repeated or skipped when paging.
        Sort sort = (sortBy != null && SORT_ZA.equalsIgnoreCase(sortBy)
                ? Sort.by(Sort.Direction.DESC, "firstName")
                : Sort.by(Sort.Direction.ASC, "firstName"))
                .and(Sort.by(Sort.Direction.ASC, "id"));

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        Page<Contact> result;
        if (search != null && !search.isBlank()) {
            // Escape LIKE wildcards so user input cannot inject % or _.
            String escaped = search.trim()
                    .replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_");
            result = contactRepo.searchByUserId(userId, escaped + "%", favoritesOnly, emergencyOnly, pageable);
        } else {
            result = contactRepo.findForUser(userId, favoritesOnly, emergencyOnly, pageable);
        }

        PaginationDto<ContactDto> dto = new PaginationDto<>();
        dto.setContacts(result.getContent().stream().map(this::toDto).toList());
        dto.setTotalContacts(result.getTotalElements());
        dto.setTotalPages(result.getTotalPages());
        dto.setContactsPerPage(size);
        dto.setCurrentPage(page);
        return dto;
    }

    /** The numbers shown next to each sidebar section. */
    @Transactional(readOnly = true)
    public ContactCountsDto getCounts(Long userId) {
        return new ContactCountsDto(
                contactRepo.countByUser_Id(userId),
                contactRepo.countByUser_IdAndFavoriteTrue(userId),
                contactRepo.countByUser_IdAndEmergencyTrue(userId),
                contactRepo.countDeletedByUserId(userId, retentionCutoff()));
    }

    @Transactional(readOnly = true)
    public ContactDto getContactByIdAndUser(Long id, Long userId) {
        return toDto(findOwnedContact(id, userId));
    }

    @Transactional
    public ContactDto createContact(Long userId, ContactRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        rejectDuplicates(userId, NEW_CONTACT, request.getPhone(), request.getEmail(), request.isAllowDuplicate());
        Contact contact = Contact.builder()
                .firstName(normalize(request.getFirstName()))
                .lastName(normalize(request.getLastName()))
                .email(normalize(request.getEmail()))
                .phone(trim(request.getPhone()))
                .address(trim(request.getAddress()))
                .emergency(Boolean.TRUE.equals(request.getEmergency()))
                .user(user)
                .build();
        return toDto(contactRepo.save(contact));
    }

    @Transactional
    public ContactDto updateContact(Long id, Long userId, ContactRequest request) {
        Contact contact = findOwnedContact(id, userId);
        rejectDuplicates(userId, id, request.getPhone(), request.getEmail(), request.isAllowDuplicate());
        contact.setFirstName(normalize(request.getFirstName()));
        contact.setLastName(normalize(request.getLastName()));
        contact.setEmail(normalize(request.getEmail()));
        contact.setPhone(trim(request.getPhone()));
        contact.setAddress(trim(request.getAddress()));
        // Left out of the request: keep the current value.
        if (request.getEmergency() != null) {
            contact.setEmergency(request.getEmergency());
        }
        return toDto(contactRepo.save(contact));
    }

    /** Stars or unstars one of the user's contacts. */
    @Transactional
    public ContactDto setFavorite(Long id, Long userId, boolean favorite) {
        Contact contact = findOwnedContact(id, userId);
        contact.setFavorite(favorite);
        return toDto(contactRepo.save(contact));
    }

    /** Marks or unmarks one of the user's contacts as an emergency contact. */
    @Transactional
    public ContactDto setEmergency(Long id, Long userId, boolean emergency) {
        Contact contact = findOwnedContact(id, userId);
        contact.setEmergency(emergency);
        return toDto(contactRepo.save(contact));
    }

    /**
     * Moves the contact to Recently deleted: it disappears from the contact list straight away and can be
     * restored for {@link #RETENTION}, after which {@link #purgeDeletedContacts()} removes it for good.
     */
    @Transactional
    public void deleteContact(Long id, Long userId) {
        Contact contact = findOwnedContact(id, userId);
        contact.setDeletedAt(Instant.now());
        contactRepo.save(contact);
    }

    /** The user's Recently deleted list, most recently deleted first. */
    @Transactional(readOnly = true)
    public PaginationDto<ContactDto> getRecentlyDeleted(Long userId, int page) {
        page = Math.max(page, 1);
        Page<Contact> result = contactRepo.findDeletedByUserId(userId, retentionCutoff(),
                PageRequest.of(page - 1, RECENTLY_DELETED_PAGE_SIZE));

        PaginationDto<ContactDto> dto = new PaginationDto<>();
        dto.setContacts(result.getContent().stream().map(this::toDto).toList());
        dto.setTotalContacts(result.getTotalElements());
        dto.setTotalPages(result.getTotalPages());
        dto.setContactsPerPage(RECENTLY_DELETED_PAGE_SIZE);
        dto.setCurrentPage(page);
        return dto;
    }

    /**
     * Brings a contact back from Recently deleted with its id and star. 404 if it isn't there (or has expired);
     * 409 if a contact with the same phone or email was added in the meantime, unless {@code allowDuplicate}.
     */
    @Transactional
    public ContactDto restoreContact(Long id, Long userId, boolean allowDuplicate) {
        Contact contact = contactRepo.findDeletedByIdAndUserId(id, userId)
                .filter(deleted -> deleted.getDeletedAt().isAfter(retentionCutoff()))
                .orElseThrow(() -> new ResourceNotFoundException(NO_LONGER_RESTORABLE));
        rejectDuplicates(userId, id, contact.getPhone(), contact.getEmail(), allowDuplicate);
        contact.setDeletedAt(null);
        return toDto(contactRepo.save(contact));
    }

    /**
     * Deletes a contact from Recently deleted for good, without waiting for the 30 days. Only works on contacts
     * already in Recently deleted, so a live contact can't skip that step.
     */
    @Transactional
    public void deletePermanently(Long id, Long userId) {
        if (contactRepo.deleteDeletedByIdAndUserId(id, userId) == 0) {
            throw new ResourceNotFoundException(NO_LONGER_RESTORABLE);
        }
        log.info("User {} permanently deleted contact {}", userId, id);
    }

    /** Removes contacts that have been in Recently deleted for longer than {@link #RETENTION}. Runs hourly. */
    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT1M")
    @Transactional
    public void purgeDeletedContacts() {
        int removed = contactRepo.purgeDeletedBefore(retentionCutoff());
        if (removed > 0) {
            log.info("Permanently removed {} contact(s) deleted more than {} days ago", removed, RETENTION.toDays());
        }
    }

    /** Contacts deleted before this moment have expired. */
    private static Instant retentionCutoff() {
        return Instant.now().minus(RETENTION);
    }

    /**
     * The user's other contacts with this phone number (compared by digits only, so "0300-1234567" and
     * "03001234567" match) or this email (ignoring case). Phone matches come first. {@code excludeContactId} is
     * the contact being edited, or 0 for a new one. Deleted contacts never count.
     */
    @Transactional(readOnly = true)
    public List<DuplicateMatchDto> findDuplicates(Long userId, long excludeContactId, String phone, String rawEmail) {
        List<DuplicateMatchDto> matches = new ArrayList<>();
        String phoneDigits = phone == null ? "" : phone.replaceAll("\\D", "");
        if (!phoneDigits.isEmpty()) {
            contactRepo.findPhoneMatches(userId, phoneDigits, excludeContactId)
                    .forEach(match -> matches.add(toMatch(match, "phone")));
        }
        String email = normalize(rawEmail);
        if (email != null && !email.isEmpty()) {
            contactRepo.findTop5ByUser_IdAndEmailIgnoreCaseAndIdNotOrderByIdAsc(userId, email, excludeContactId)
                    .forEach(match -> matches.add(toMatch(match, "email")));
        }
        return matches;
    }

    /**
     * Stops the user saving the same person twice by accident: 409 listing the matching contacts, unless the
     * user has already seen the warning and chosen to save anyway.
     */
    private void rejectDuplicates(Long userId, long excludeContactId, String phone, String email,
                                  boolean allowDuplicate) {
        if (allowDuplicate) {
            return;
        }
        List<DuplicateMatchDto> matches = findDuplicates(userId, excludeContactId, phone, email);
        if (!matches.isEmpty()) {
            boolean phoneClash = matches.stream().anyMatch(match -> "phone".equals(match.field()));
            throw new DuplicateContactException(phoneClash ? DUPLICATE_PHONE : DUPLICATE_EMAIL, matches);
        }
    }

    private static DuplicateMatchDto toMatch(Contact contact, String field) {
        return new DuplicateMatchDto(contact.getId(), contact.getFirstName(), contact.getLastName(), field);
    }

    /**
     * Loads a contact and checks that it belongs to the given user. Someone else's contact gets the same 404 as a
     * missing one; a 403 would confirm that the id exists, and ids are sequential.
     */
    private Contact findOwnedContact(Long id, Long userId) {
        return contactRepo.findById(id)
                .filter(contact -> contact.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id " + id));
    }

    private ContactDto toDto(Contact contact) {
        ContactDto dto = new ContactDto();
        dto.setId(contact.getId());
        dto.setFirstName(contact.getFirstName());
        dto.setLastName(contact.getLastName());
        dto.setEmail(contact.getEmail());
        dto.setPhone(contact.getPhone());
        dto.setAddress(contact.getAddress());
        dto.setFavorite(contact.isFavorite());
        dto.setEmergency(contact.isEmergency());
        if (contact.getDeletedAt() != null) {
            dto.setDeletedAt(contact.getDeletedAt().toString());
            dto.setDeletesPermanentlyAt(contact.getDeletedAt().plus(RETENTION).toString());
        }
        return dto;
    }
}
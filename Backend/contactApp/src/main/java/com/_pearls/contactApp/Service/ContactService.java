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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    static final String DUPLICATE_PHONE = "You already have a contact with this phone number";
    static final String DUPLICATE_EMAIL = "You already have a contact with this email";

    /** Used as "no contact to exclude" when checking a new contact for duplicates; real ids start at 1. */
    private static final long NEW_CONTACT = 0L;

    @Transactional(readOnly = true)
    public PaginationDto<ContactDto> getContactsByUserId(Long userId, String search, String sortBy, int page, int size) {
        // Out-of-range values are clamped rather than rejected: a huge size would load every contact at once,
        // and page 0 or below would otherwise make PageRequest throw.
        page = Math.max(page, 1);
        size = Math.clamp(size, 1, MAX_PAGE_SIZE);

        // Contacts with the same first name are ordered by id, so they keep the same order on every page load
        // and none is repeated or skipped when paging.
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
            result = contactRepo.searchByUserId(userId, escaped + "%", pageable);
        } else {
            result = contactRepo.findAllByUser_Id(userId, pageable);
        }

        PaginationDto<ContactDto> dto = new PaginationDto<>();
        dto.setContacts(result.getContent().stream().map(this::toDto).toList());
        dto.setTotalContacts(result.getTotalElements());
        dto.setTotalPages(result.getTotalPages());
        dto.setContactsPerPage(size);
        dto.setCurrentPage(page);
        return dto;
    }

    @Transactional(readOnly = true)
    public ContactDto getContactByIdAndUser(Long id, Long userId) {
        return toDto(findOwnedContact(id, userId));
    }

    @Transactional
    public ContactDto createContact(Long userId, ContactRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        rejectDuplicates(userId, NEW_CONTACT, request);
        Contact contact = Contact.builder()
                .firstName(normalize(request.getFirstName()))
                .lastName(normalize(request.getLastName()))
                .email(normalize(request.getEmail()))
                .phone(trim(request.getPhone()))
                .address(trim(request.getAddress()))
                .user(user)
                .build();
        return toDto(contactRepo.save(contact));
    }

    @Transactional
    public ContactDto updateContact(Long id, Long userId, ContactRequest request) {
        Contact contact = findOwnedContact(id, userId);
        rejectDuplicates(userId, id, request);
        contact.setFirstName(normalize(request.getFirstName()));
        contact.setLastName(normalize(request.getLastName()));
        contact.setEmail(normalize(request.getEmail()));
        contact.setPhone(trim(request.getPhone()));
        contact.setAddress(trim(request.getAddress()));
        return toDto(contactRepo.save(contact));
    }

    @Transactional
    public void deleteContact(Long id, Long userId) {
        Contact contact = findOwnedContact(id, userId);
        contactRepo.delete(contact);
    }

    /**
     * Stops the user saving the same person twice: another of their contacts already has this phone number
     * (compared by digits only, so "0300-1234567" and "03001234567" match) or this email.
     */
    private void rejectDuplicates(Long userId, long excludeContactId, ContactRequest request) {
        String phoneDigits = request.getPhone() == null ? "" : request.getPhone().replaceAll("\\D", "");
        if (!phoneDigits.isEmpty() && contactRepo.existsPhoneForUser(userId, phoneDigits, excludeContactId)) {
            throw new DuplicateResourceException(DUPLICATE_PHONE);
        }
        String email = normalize(request.getEmail());
        if (email != null && !email.isEmpty()
                && contactRepo.existsByUser_IdAndEmailIgnoreCaseAndIdNot(userId, email, excludeContactId)) {
            throw new DuplicateResourceException(DUPLICATE_EMAIL);
        }
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
        return dto;
    }
}
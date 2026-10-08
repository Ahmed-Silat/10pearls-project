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

    @Transactional(readOnly = true)
    public PaginationDto<ContactDto> getContactsByUserId(String userId, String search, String sortBy, int page, int size) {
        Sort sort = sortBy != null && SORT_ZA.equalsIgnoreCase(sortBy)
                ? Sort.by(Sort.Direction.DESC, "firstName")
                : Sort.by(Sort.Direction.ASC, "firstName");

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
    public ContactDto getContactByIdAndUser(String id, String userId) {
        return toDto(findOwnedContact(id, userId));
    }

    @Transactional
    public ContactDto createContact(String userId, ContactRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
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
    public ContactDto updateContact(String id, String userId, ContactRequest request) {
        Contact contact = findOwnedContact(id, userId);
        contact.setFirstName(normalize(request.getFirstName()));
        contact.setLastName(normalize(request.getLastName()));
        contact.setEmail(normalize(request.getEmail()));
        contact.setPhone(trim(request.getPhone()));
        contact.setAddress(trim(request.getAddress()));
        return toDto(contactRepo.save(contact));
    }

    @Transactional
    public void deleteContact(String id, String userId) {
        Contact contact = findOwnedContact(id, userId);
        contactRepo.delete(contact);
    }

    /** Loads a contact and checks that it belongs to the given user. */
    private Contact findOwnedContact(String id, String userId) {
        Contact contact = contactRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id " + id));
        if (!contact.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this contact");
        }
        return contact;
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
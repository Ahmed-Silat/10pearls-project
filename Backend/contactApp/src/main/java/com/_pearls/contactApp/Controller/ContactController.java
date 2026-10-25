package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.ContactCountsDto;
import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.ContactRequest;
import com._pearls.contactApp.Dto.DuplicateMatchDto;
import com._pearls.contactApp.Dto.EmergencyRequest;
import com._pearls.contactApp.Dto.FavoriteRequest;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.ExceptionHandling.ForbiddenException;
import com._pearls.contactApp.Service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping("/user/{id}")
    public PaginationDto<ContactDto> getContactsByUserId(@PathVariable Long id,
            @AuthenticationPrincipal AuthUser principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "all") String filter) {
        requireSelf(id, principal);
        return contactService.getContactsByUserId(id, search, sortBy, page, size, filter);
    }

    /** How many contacts are in each sidebar section (all, favorites, emergency, recently deleted). */
    @GetMapping("/counts")
    public ContactCountsDto getCounts(@AuthenticationPrincipal AuthUser principal) {
        return contactService.getCounts(principal.getId());
    }

    @GetMapping("/{id}")
    public ContactDto getContactById(@PathVariable Long id, @AuthenticationPrincipal AuthUser principal) {
        return contactService.getContactByIdAndUser(id, principal.getId());
    }

    @PostMapping
    public ResponseEntity<ContactDto> createContact(@Valid @RequestBody ContactRequest request,
            @AuthenticationPrincipal AuthUser principal) {
        ContactDto contact = contactService.createContact(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(contact);
    }

    @PutMapping("/{id}")
    public ContactDto updateContact(@PathVariable Long id,
            @Valid @RequestBody ContactRequest request,
            @AuthenticationPrincipal AuthUser principal) {
        return contactService.updateContact(id, principal.getId(), request);
    }

    /** Stars or unstars a contact: {@code {"favorite": true}}. Returns the updated contact. */
    @PatchMapping("/{id}/favorite")
    public ContactDto setFavorite(@PathVariable Long id,
            @Valid @RequestBody FavoriteRequest request,
            @AuthenticationPrincipal AuthUser principal) {
        return contactService.setFavorite(id, principal.getId(), request.getFavorite());
    }

    /** Marks or unmarks an emergency contact: {@code {"emergency": true}}. Returns the updated contact. */
    @PatchMapping("/{id}/emergency")
    public ContactDto setEmergency(@PathVariable Long id,
            @Valid @RequestBody EmergencyRequest request,
            @AuthenticationPrincipal AuthUser principal) {
        return contactService.setEmergency(id, principal.getId(), request.getEmergency());
    }

    /** The signed-in user's Recently deleted contacts, newest first, 20 per page. */
    @GetMapping("/deleted")
    public PaginationDto<ContactDto> getRecentlyDeleted(@RequestParam(defaultValue = "1") int page,
            @AuthenticationPrincipal AuthUser principal) {
        return contactService.getRecentlyDeleted(principal.getId(), page);
    }

    /** Deletes a contact from Recently deleted for good. */
    @DeleteMapping("/deleted/{id}")
    public ResponseEntity<Void> deletePermanently(@PathVariable Long id, @AuthenticationPrincipal AuthUser principal) {
        contactService.deletePermanently(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    /** Moves a contact out of Recently deleted, back into the contact list. Returns the restored contact. */
    @PostMapping("/{id}/restore")
    public ContactDto restoreContact(@PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean allowDuplicate,
            @AuthenticationPrincipal AuthUser principal) {
        return contactService.restoreContact(id, principal.getId(), allowDuplicate);
    }

    /**
     * The user's contacts that already have this phone number or email, for warning while the Add/Edit form is
     * being filled in. {@code excludeId} is the contact being edited (omit it for a new contact).
     */
    @GetMapping("/duplicates")
    public List<DuplicateMatchDto> findDuplicates(@RequestParam(required = false) String phone,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "0") long excludeId,
            @AuthenticationPrincipal AuthUser principal) {
        return contactService.findDuplicates(principal.getId(), excludeId, phone, email);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id, @AuthenticationPrincipal AuthUser principal) {
        contactService.deleteContact(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    /** Users may only operate on their own data. */
    private static void requireSelf(Long requestedUserId, AuthUser principal) {
        if (principal == null || !principal.getId().equals(requestedUserId)) {
            throw new ForbiddenException("You may only access your own contacts");
        }
    }
}
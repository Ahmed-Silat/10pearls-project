package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.ContactRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping("/user/{id}")
    public PaginationDto<ContactDto> getContactsByUserId(@PathVariable String id,
            @AuthenticationPrincipal AuthUser principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        requireSelf(id, principal);
        return contactService.getContactsByUserId(id, search, sortBy, page, size);
    }

    @GetMapping("/{id}")
    public ContactDto getContactById(@PathVariable String id, @AuthenticationPrincipal AuthUser principal) {
        return contactService.getContactByIdAndUser(id, principal.getId());
    }

    @PostMapping
    public ResponseEntity<ContactDto> createContact(@Valid @RequestBody ContactRequest request,
            @AuthenticationPrincipal AuthUser principal) {
        ContactDto contact = contactService.createContact(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(contact);
    }

    @PutMapping("/{id}")
    public ContactDto updateContact(@PathVariable String id,
            @Valid @RequestBody ContactRequest request,
            @AuthenticationPrincipal AuthUser principal) {
        return contactService.updateContact(id, principal.getId(), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable String id, @AuthenticationPrincipal AuthUser principal) {
        contactService.deleteContact(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    /** Users may only operate on their own data. */
    private static void requireSelf(String requestedUserId, AuthUser principal) {
        if (principal == null || !principal.getId().equals(requestedUserId)) {
            throw new ForbiddenException("You may only access your own contacts");
        }
    }
}
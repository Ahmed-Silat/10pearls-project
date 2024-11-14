package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.FilterContactDto;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
public class ContactController {

    @Autowired
    private ContactService contactService;

    @GetMapping("/user/{id}")
    public PaginationDto getContactsByUserId(@PathVariable String id, @RequestParam(required = false) String search, @RequestParam(required = false) String sortBy, @RequestParam(value = "page", defaultValue = "1") int page, @RequestParam(value = "size", defaultValue = "10") int size) {
        if (page <= 0 || size <= 0) {
            throw new ResourceNotFoundException("Page and size parameters must be greater than 0.");
        }

        FilterContactDto filterContactDto = new FilterContactDto();
        filterContactDto.setSortBy(sortBy);

        PaginationDto paginationDto = contactService.getContactsByUserId(id, search, filterContactDto, page, size);

        if (paginationDto == null || paginationDto.getContact().isEmpty()) {
            throw new ResourceNotFoundException("No contacts found for user with ID: " + id);
        }

        return paginationDto;
    }

    @GetMapping("/{id}")
    public Optional<Contact> getContactsByContactId(@PathVariable String id) {
        return Optional.ofNullable(contactService.getContactsByContactId(id).orElseThrow(() -> new ResourceNotFoundException("Contact not found with id: " + id)));
    }

    @PostMapping
    public Contact createContact(@RequestBody ContactDto contactDto) {
        if (contactDto == null || contactDto.getFirstName() == null || contactDto.getLastName() == null || contactDto.getEmail() == null || contactDto.getPhone() == null || contactDto.getAddress() == null || contactDto.getUser_id() == null) {
            throw new ResourceNotFoundException("Contact creation failed. Ensure none of the field is null.");
        } else if (contactDto.getFirstName().isEmpty() || contactDto.getLastName().isEmpty() || contactDto.getEmail().isEmpty() || contactDto.getPhone().isEmpty() || contactDto.getAddress().isEmpty() || contactDto.getUser_id().isEmpty()) {
            throw new ResourceNotFoundException("Contact creation failed. Ensure none of the field is empty.");
        }
        return contactService.createContact(contactDto);
    }

    @PutMapping("/{id}")
    public Contact updateContact(@PathVariable String id, @RequestBody ContactDto contactDto) {
        if (!contactService.getContactsByContactId(id).isPresent()) {
            throw new ResourceNotFoundException("Contact with ID: " + id + " not found. Update operation failed.");
        } else if (contactDto.getFirstName().isEmpty() || contactDto.getLastName().isEmpty() || contactDto.getEmail().isEmpty() || contactDto.getPhone().isEmpty() || contactDto.getAddress().isEmpty() || contactDto.getUser_id().isEmpty()) {
            throw new ResourceNotFoundException("Contact creation failed. Ensure none of the field is empty.");
        }
        return contactService.updateContact(id, contactDto);
    }

    @DeleteMapping("/{id}")
    public Contact deleteContact(@PathVariable String id) {
        Optional<Contact> contact = contactService.getContactsByContactId(id);
        if (!contact.isPresent()) {
            throw new ResourceNotFoundException("Contact with ID: " + id + " does not exist. Delete operation failed.");
        }
        return contactService.deleteContact(id);
    }

}

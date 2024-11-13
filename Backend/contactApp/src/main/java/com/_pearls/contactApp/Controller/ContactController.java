package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.FilterContactDto;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
public class ContactController {

    @Autowired
    private ContactService contactService;

    @GetMapping("/user/{id}")
    public PaginationDto getContactsByUserId(@PathVariable String id, @RequestParam(required = false) String search, @RequestParam(required = false) String sortBy, @RequestParam(value = "page", defaultValue = "1") int page, @RequestParam(value = "size", defaultValue = "10") int size) {
        FilterContactDto filterContactDto = new FilterContactDto();
        filterContactDto.setSortBy(sortBy);
        return contactService.getContactsByUserId(id, search, filterContactDto, page, size);
    }

    @GetMapping("/{id}")
    public Optional<Contact> getContactsByContactId(@PathVariable String id) {
        return contactService.getContactsByContactId(id);
    }

    @PostMapping
    public Contact createContact(@RequestBody ContactDto contactDto) {
        return contactService.createContact(contactDto);
    }

    @PutMapping("/{id}")
    public Contact updateContact(@PathVariable String id, @RequestBody ContactDto contactDto) {
        return contactService.updateContact(id, contactDto);
    }

    @DeleteMapping("/{id}")
    public Contact deleteContact(@PathVariable String id) {
        return contactService.deleteContact(id);
    }

}

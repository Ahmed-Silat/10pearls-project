package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Dto.ContactDto;
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

    @GetMapping("/{id}")
    public List<Contact> getContactsByUserId(@PathVariable String id) {
        return contactService.getContactsByUserId(id);
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

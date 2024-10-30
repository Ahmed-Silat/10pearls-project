package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.ContactRepo;
import com._pearls.contactApp.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@Transactional(rollbackOn = Exception.class)
@RequiredArgsConstructor
public class ContactService {

    @Autowired
    private ContactRepo contactRepo;

    @Autowired
    private UserRepo userRepo;

    public List<Contact> getContactsByUserId(String id) {
        return contactRepo.findAllByUser_Id(id);
    }

    public List<Contact> getContactsByContactId(String id) {
        return contactRepo.findAllById(id);
    }


    public Contact createContact(ContactDto contactDto) {
        Contact contact = new Contact();
        contact.setFirstName(contactDto.getFirstName());
        contact.setLastName(contactDto.getLastName());
        contact.setEmail(contactDto.getEmail());
        contact.setPhone(contactDto.getPhone());
        contact.setAddress(contactDto.getAddress());
        User user = userRepo.findById(contactDto.getUser_id()).get();
        contact.setUser(user);
        contactRepo.save(contact);
        return contact;
    }

    public Contact updateContact(String id, ContactDto contactDto) {
        Contact updatedContact = contactRepo.findById(id).get();
//        if (updatedContact!=null) {
//            throw new RuntimeException("No contacts found for the given user ID " + id);
//        }
        updatedContact.setFirstName(contactDto.getFirstName());
        updatedContact.setLastName(contactDto.getLastName());
        updatedContact.setEmail(contactDto.getEmail());
        updatedContact.setPhone(contactDto.getPhone());
        updatedContact.setAddress(contactDto.getAddress());
        User user = userRepo.findById(contactDto.getUser_id()).get();
        updatedContact.setUser(user);
        contactRepo.save(updatedContact);
        return updatedContact;
    }


    public Contact deleteContact(String id) {
        Contact deleteContact = contactRepo.findById(id).orElse(null);

        if (deleteContact != null) {
            Contact contact = deleteContact;
            contact.setUser(null);
            contactRepo.save(contact);
            contactRepo.delete(contact);
            return deleteContact;
        }
        return null;
    }

}

package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.FilterContactDto;
import com._pearls.contactApp.Dto.PaginationDto;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.ContactRepo;
import com._pearls.contactApp.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@Transactional(rollbackOn = Exception.class)
@RequiredArgsConstructor
public class ContactService {

    @Autowired
    private ContactRepo contactRepo;

    @Autowired
    private UserRepo userRepo;

    public PaginationDto getContactsByUserId(String userId, String search, FilterContactDto filterContactDto, int page, int size) {
        Sort sort = Sort.unsorted();
        if (filterContactDto != null && filterContactDto.getSortBy() != null) {
            if (filterContactDto.getSortBy().equalsIgnoreCase("A-Z")) {
                sort = Sort.by(Sort.Direction.ASC, "firstName");
            } else if (filterContactDto.getSortBy().equalsIgnoreCase("Z-A")) {
                sort = Sort.by(Sort.Direction.DESC, "firstName");
            }
        }

        List<Contact> allContacts = contactRepo.findContactsByUserId(userId);

        System.out.println(allContacts.size());

        double totalPages = totalPagesCount(allContacts.size(), size);

        System.out.println(totalPages);

        PaginationDto paginationDto = new PaginationDto();
        paginationDto.setTotalContacts(allContacts.size());
        paginationDto.setContactsPerPage(size);
        paginationDto.setCurrentPage(page);
        paginationDto.setTotalPages(totalPages);

        page = page - 1;

        Pageable pageable = PageRequest.of(page, size, sort);

        if (search != null && !search.isEmpty()) {
            List<Contact> contactList = contactRepo.findAllByUserIdAndSearch(userId, search, pageable);
            paginationDto.setContact(contactList);
            return paginationDto;
        }

        List<Contact> contacts = contactRepo.findAllByUser_Id(userId, pageable);
        paginationDto.setContact(contacts);
        return paginationDto;

    }

    public double totalPagesCount(double totalNoOfContacts, double contactsPerPage) {
        double totalPagesCount = 0;
        if ((totalNoOfContacts % contactsPerPage) != 0) {
            totalPagesCount = totalNoOfContacts / contactsPerPage;
            return Math.ceil(totalPagesCount);
        }
        totalPagesCount = totalNoOfContacts / contactsPerPage;
        return totalPagesCount;
    }

    public Optional<Contact> getContactsByContactId(String id) {
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

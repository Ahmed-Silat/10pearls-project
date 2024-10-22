package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepo extends JpaRepository<Contact, String> {
    Optional<Contact> findById(String id);

    List<Contact> findAllByUser_Id(String userId);
}

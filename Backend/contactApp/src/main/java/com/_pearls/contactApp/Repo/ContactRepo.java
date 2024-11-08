package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.Contact;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepo extends JpaRepository<Contact, String> {
    Optional<Contact> findById(String id);

    @Query("SELECT c FROM Contact c WHERE c.user.id = :userId AND " + "(LOWER(c.firstName) LIKE LOWER(CONCAT(:search, '%')) OR " + "LOWER(c.lastName) LIKE LOWER(CONCAT(:search, '%')) OR " + "LOWER(c.email) LIKE LOWER(CONCAT(:search, '%')) OR " + "LOWER(c.phone) LIKE LOWER(CONCAT(:search, '%')) OR " + "LOWER(c.address) LIKE LOWER(CONCAT(:search, '%')))")
    List<Contact> findAllByUserIdAndSearch(String userId, String search, Pageable pageable);

    List<Contact> findAllByUser_Id(String userId, Pageable pageable);

    Optional<Contact> findAllById(String contactId);
}

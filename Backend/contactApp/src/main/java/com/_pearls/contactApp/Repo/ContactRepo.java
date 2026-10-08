package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContactRepo extends JpaRepository<Contact, String>, JpaSpecificationExecutor<Contact> {

    /** Prefix search across name/email/phone/address. {@code pattern} must already have wildcards escaped. */
    @Query("""
            SELECT c FROM Contact c
            WHERE c.user.id = :userId
              AND (LOWER(c.firstName) LIKE LOWER(:pattern)
               OR LOWER(c.lastName)  LIKE LOWER(:pattern)
               OR LOWER(c.email)     LIKE LOWER(:pattern)
               OR LOWER(c.phone)     LIKE LOWER(:pattern)
               OR LOWER(c.address)   LIKE LOWER(:pattern))
            """)
    Page<Contact> searchByUserId(@Param("userId") String userId, String pattern, Pageable pageable);

    Page<Contact> findAllByUser_Id(String userId, Pageable pageable);
}
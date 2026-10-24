package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContactRepo extends JpaRepository<Contact, Long>, JpaSpecificationExecutor<Contact> {

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
    Page<Contact> searchByUserId(@Param("userId") Long userId, String pattern, Pageable pageable);

    Page<Contact> findAllByUser_Id(Long userId, Pageable pageable);

    /**
     * Whether another of the user's contacts has this phone number, comparing digits only so formatting
     * ("0300-1234567" vs "03001234567") doesn't matter. {@code excludeId} is the contact being edited, or 0.
     */
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM contacts
                WHERE user_id = :userId
                  AND contact_id <> :excludeId
                  AND regexp_replace(phone, '[^0-9]', '', 'g') = :phoneDigits)
            """, nativeQuery = true)
    boolean existsPhoneForUser(@Param("userId") Long userId, @Param("phoneDigits") String phoneDigits,
                               @Param("excludeId") long excludeId);

    boolean existsByUser_IdAndEmailIgnoreCaseAndIdNot(Long userId, String email, Long id);
}
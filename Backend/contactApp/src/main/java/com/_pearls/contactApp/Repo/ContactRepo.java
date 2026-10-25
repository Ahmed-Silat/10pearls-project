package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ContactRepo extends JpaRepository<Contact, Long>, JpaSpecificationExecutor<Contact> {

    /**
     * Prefix search across name/email/phone/address. {@code pattern} must already have wildcards escaped.
     * {@code favoritesOnly} and {@code emergencyOnly} limit it to the Favorites or Emergency page.
     */
    @Query("""
            SELECT c FROM Contact c
            WHERE c.user.id = :userId
              AND (:favoritesOnly = false OR c.favorite = true)
              AND (:emergencyOnly = false OR c.emergency = true)
              AND (LOWER(c.firstName) LIKE LOWER(:pattern)
               OR LOWER(c.lastName)  LIKE LOWER(:pattern)
               OR LOWER(c.email)     LIKE LOWER(:pattern)
               OR LOWER(c.phone)     LIKE LOWER(:pattern)
               OR LOWER(c.address)   LIKE LOWER(:pattern))
            """)
    Page<Contact> searchByUserId(@Param("userId") Long userId, @Param("pattern") String pattern,
                                 @Param("favoritesOnly") boolean favoritesOnly,
                                 @Param("emergencyOnly") boolean emergencyOnly, Pageable pageable);

    /**
     * The user's contacts; {@code favoritesOnly} limits it to starred ones (the Favorites page) and
     * {@code emergencyOnly} to emergency contacts (the Emergency page).
     */
    @Query("""
            SELECT c FROM Contact c
            WHERE c.user.id = :userId
              AND (:favoritesOnly = false OR c.favorite = true)
              AND (:emergencyOnly = false OR c.emergency = true)
            """)
    Page<Contact> findForUser(@Param("userId") Long userId, @Param("favoritesOnly") boolean favoritesOnly,
                              @Param("emergencyOnly") boolean emergencyOnly, Pageable pageable);

    long countByUser_Id(Long userId);

    long countByUser_IdAndFavoriteTrue(Long userId);

    long countByUser_IdAndEmergencyTrue(Long userId);

    /** How many contacts the user has in Recently deleted (deleted since {@code cutoff}). */
    @Query(value = """
            SELECT count(*) FROM contacts
            WHERE user_id = :userId AND deleted_at IS NOT NULL AND deleted_at >= :cutoff
            """, nativeQuery = true)
    long countDeletedByUserId(@Param("userId") Long userId, @Param("cutoff") Instant cutoff);

    /**
     * The user's other contacts with this phone number (up to 5), comparing digits only so formatting
     * ("0300-1234567" vs "03001234567") doesn't matter. {@code excludeId} is the contact being edited, or 0.
     */
    @Query(value = """
            SELECT * FROM contacts
            WHERE user_id = :userId
              AND contact_id <> :excludeId
              AND deleted_at IS NULL
              AND regexp_replace(phone, '[^0-9]', '', 'g') = :phoneDigits
            ORDER BY contact_id
            LIMIT 5
            """, nativeQuery = true)
    List<Contact> findPhoneMatches(@Param("userId") Long userId, @Param("phoneDigits") String phoneDigits,
                                   @Param("excludeId") long excludeId);

    /** The user's other contacts with this email (up to 5), ignoring case. */
    List<Contact> findTop5ByUser_IdAndEmailIgnoreCaseAndIdNotOrderByIdAsc(Long userId, String email, Long id);

    /** One of the user's deleted (not yet purged) contacts. Native, so the entity's "not deleted" filter doesn't apply. */
    @Query(value = """
            SELECT * FROM contacts
            WHERE contact_id = :id AND user_id = :userId AND deleted_at IS NOT NULL
            """, nativeQuery = true)
    Optional<Contact> findDeletedByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    /** The user's Recently deleted list: deleted since {@code cutoff}, most recently deleted first. */
    @Query(value = """
            SELECT * FROM contacts
            WHERE user_id = :userId AND deleted_at IS NOT NULL AND deleted_at >= :cutoff
            ORDER BY deleted_at DESC, contact_id DESC
            """,
            countQuery = """
            SELECT count(*) FROM contacts
            WHERE user_id = :userId AND deleted_at IS NOT NULL AND deleted_at >= :cutoff
            """,
            nativeQuery = true)
    Page<Contact> findDeletedByUserId(@Param("userId") Long userId, @Param("cutoff") Instant cutoff,
                                      Pageable pageable);

    /** Permanently removes one of the user's contacts, but only if it is in Recently deleted. Returns 0 or 1. */
    @Modifying
    @Query(value = """
            DELETE FROM contacts
            WHERE contact_id = :id AND user_id = :userId AND deleted_at IS NOT NULL
            """, nativeQuery = true)
    int deleteDeletedByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    /** Permanently removes contacts deleted before the cutoff. Returns how many were removed. */
    @Modifying
    @Query(value = "DELETE FROM contacts WHERE deleted_at < :cutoff", nativeQuery = true)
    int purgeDeletedBefore(@Param("cutoff") Instant cutoff);
}
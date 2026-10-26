package com._pearls.contactApp.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Deleted contacts stay in the table for a short grace period so the delete can be undone. The restriction
 * below hides them from every entity query (lists, search, find by id, duplicate checks); only the native
 * queries in ContactRepo that restore or purge them can see them.
 */
@Entity
@Table(name = "contacts", indexes = @Index(name = "idx_contacts_user_id", columnList = "user_id"))
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contact_id", updatable = false)
    private Long id;

    @UuidGenerator
    @Column(name = "uuid", nullable = false, unique = true, updatable = false)
    private UUID uuid;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column
    private String email;

    @Column
    private String phone;

    @Column
    private String address;

    @Column(name = "company", length = 100)
    private String company;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "notes", length = 2000)
    private String notes;

    /**
     * Phone numbers besides the main one ({@link #phone}), in the order the user entered them. Like tags, loaded
     * for a whole page of contacts in one query (BatchSize).
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "contact_phones", joinColumns = @JoinColumn(name = "contact_id"))
    @OrderColumn(name = "position")
    @BatchSize(size = 100)
    @Builder.Default
    private List<ContactDetail> additionalPhones = new ArrayList<>();

    /** Emails besides the main one ({@link #email}), in the order the user entered them. */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "contact_emails", joinColumns = @JoinColumn(name = "contact_id"))
    @OrderColumn(name = "position")
    @BatchSize(size = 100)
    @Builder.Default
    private List<ContactDetail> additionalEmails = new ArrayList<>();

    /** Starred by the user; starred contacts are listed on the Favorites page. */
    @Column(name = "favorite", nullable = false)
    private boolean favorite;

    /** Someone to reach in an emergency; these contacts are listed on the Emergency page. */
    @Column(name = "emergency", nullable = false)
    private boolean emergency;

    /** When the user deleted it; null while the contact is live. */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    /**
     * The user's tags on this contact. Loaded for a whole page of contacts in one query (BatchSize), not one
     * query per contact. They stay while the contact is in Recently deleted, so a restore brings them back.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "contact_tags",
            joinColumns = @JoinColumn(name = "contact_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @BatchSize(size = 100)
    @JsonIgnore
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();
}
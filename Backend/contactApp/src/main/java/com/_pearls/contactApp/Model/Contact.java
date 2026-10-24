package com._pearls.contactApp.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
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

    /** Starred by the user; starred contacts are listed on the Favorites page. */
    @Column(name = "favorite", nullable = false)
    private boolean favorite;

    /** When the user deleted it; null while the contact is live. */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
}
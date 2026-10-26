package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepo extends JpaRepository<Tag, Long> {

    List<Tag> findByUser_Id(Long userId);

    Optional<Tag> findByIdAndUser_Id(Long id, Long userId);

    /** The user's tags among {@code ids}; ids of other users' tags (or no tag) are simply missing. */
    List<Tag> findByUser_IdAndIdIn(Long userId, Collection<Long> ids);

    /** Whether another of the user's tags has this name, ignoring case. {@code excludeId} is the tag being renamed, or 0. */
    boolean existsByUser_IdAndNameIgnoreCaseAndIdNot(Long userId, String name, Long excludeId);

    /** How many of the user's live contacts have each tag. Tags no contact has are missing. */
    @Query("""
            SELECT t.id AS tagId, COUNT(c) AS contactCount
            FROM Contact c JOIN c.tags t
            WHERE c.user.id = :userId
            GROUP BY t.id
            """)
    List<TagCount> countContactsPerTag(@Param("userId") Long userId);

    /** How many live contacts have this tag. */
    @Query("SELECT COUNT(c) FROM Contact c JOIN c.tags t WHERE t.id = :tagId")
    long countContactsWithTag(@Param("tagId") Long tagId);

    interface TagCount {
        Long getTagId();

        long getContactCount();
    }
}

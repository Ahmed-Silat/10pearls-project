package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.TagDto;
import com._pearls.contactApp.Dto.TagRequest;
import com._pearls.contactApp.ExceptionHandling.DuplicateResourceException;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.Model.Tag;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.TagRepo;
import com._pearls.contactApp.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com._pearls.contactApp.Util.TextUtils.collapseSpaces;

/** The user's tags (groups such as Family or Work): list, create, rename/recolour and delete. */
@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepo tagRepo;
    private final UserRepo userRepo;

    /** Used as "no tag to exclude" when checking a new tag's name; real ids start at 1. */
    private static final long NEW_TAG = 0L;

    /** The user's tags, sorted by name, each with how many of their contacts have it. */
    @Transactional(readOnly = true)
    public List<TagDto> getTags(Long userId) {
        Map<Long, Long> counts = tagRepo.countContactsPerTag(userId).stream()
                .collect(Collectors.toMap(TagRepo.TagCount::getTagId, TagRepo.TagCount::getContactCount));
        return tagRepo.findByUser_Id(userId).stream()
                .sorted(Comparator.comparing(Tag::getName, String.CASE_INSENSITIVE_ORDER))
                .map(tag -> toDto(tag, counts.getOrDefault(tag.getId(), 0L)))
                .toList();
    }

    @Transactional
    public TagDto createTag(Long userId, TagRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        String name = collapseSpaces(request.getName());
        rejectDuplicateName(userId, name, NEW_TAG);
        Tag tag = tagRepo.save(Tag.builder().name(name).color(request.getColor()).user(user).build());
        return toDto(tag, 0);
    }

    /** Renames and/or recolours one of the user's tags. Changing only the case of the name is allowed. */
    @Transactional
    public TagDto updateTag(Long id, Long userId, TagRequest request) {
        Tag tag = findOwnedTag(id, userId);
        String name = collapseSpaces(request.getName());
        rejectDuplicateName(userId, name, id);
        tag.setName(name);
        tag.setColor(request.getColor());
        tag = tagRepo.save(tag);
        return toDto(tag, tagRepo.countContactsWithTag(id));
    }

    /** Deletes one of the user's tags. Its contacts stay; they just no longer have the tag (the database removes the links). */
    @Transactional
    public void deleteTag(Long id, Long userId) {
        tagRepo.delete(findOwnedTag(id, userId));
    }

    /** One of the user's tags. Someone else's tag gets the same 404 as a missing one. */
    Tag findOwnedTag(Long id, Long userId) {
        return tagRepo.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id " + id));
    }

    /** Two tags with the same name (ignoring case) would be impossible to tell apart in the sidebar. */
    private void rejectDuplicateName(Long userId, String name, long excludeId) {
        if (tagRepo.existsByUser_IdAndNameIgnoreCaseAndIdNot(userId, name, excludeId)) {
            throw new DuplicateResourceException("You already have a tag called \"" + name + "\"");
        }
    }

    private static TagDto toDto(Tag tag, long contactCount) {
        return new TagDto(tag.getId(), tag.getName(), tag.getColor(), contactCount);
    }
}

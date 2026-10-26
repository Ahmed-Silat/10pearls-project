package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.TagDto;
import com._pearls.contactApp.Dto.TagRequest;
import com._pearls.contactApp.ExceptionHandling.DuplicateResourceException;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.Model.Tag;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.TagRepo;
import com._pearls.contactApp.Repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepo tagRepo;

    @Mock
    private UserRepo userRepo;

    @InjectMocks
    private TagService tagService;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).email("owner@example.com").build();
    }

    private Tag tag(Long id, String name, String color) {
        return Tag.builder().id(id).name(name).color(color).user(owner).build();
    }

    private TagRequest request(String name, String color) {
        TagRequest request = new TagRequest();
        request.setName(name);
        request.setColor(color);
        return request;
    }

    /** A row of the per-tag contact counts. */
    private record Count(Long getTagId, long getContactCount) implements TagRepo.TagCount {
    }

    @Test
    void getTags_sortsByNameIgnoringCase_withContactCounts() {
        when(tagRepo.findByUser_Id(1L)).thenReturn(List.of(tag(1L, "work", "blue"), tag(2L, "Family", "green")));
        when(tagRepo.countContactsPerTag(1L)).thenReturn(List.of(new Count(1L, 4)));

        List<TagDto> tags = tagService.getTags(1L);

        // "Family" first despite the capital; a tag no contact has shows 0.
        assertThat(tags).containsExactly(
                new TagDto(2L, "Family", "green", 0),
                new TagDto(1L, "work", "blue", 4));
    }

    @Test
    void createTag_tidiesSpacesButKeepsTheCase() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(tagRepo.existsByUser_IdAndNameIgnoreCaseAndIdNot(1L, "Close friends", 0L)).thenReturn(false);
        when(tagRepo.save(any(Tag.class))).thenAnswer(inv -> {
            Tag saved = inv.getArgument(0);
            saved.setId(7L);
            return saved;
        });

        TagDto created = tagService.createTag(1L, request("  Close   friends ", "violet"));

        assertThat(created).isEqualTo(new TagDto(7L, "Close friends", "violet", 0));
        verify(tagRepo).save(argThat(saved -> saved.getUser() == owner));
    }

    @Test
    void createTag_sameNameInAnyCase_isRejected() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(owner));
        when(tagRepo.existsByUser_IdAndNameIgnoreCaseAndIdNot(1L, "WORK", 0L)).thenReturn(true);

        assertThatThrownBy(() -> tagService.createTag(1L, request("WORK", "blue")))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("You already have a tag called \"WORK\"");
        verify(tagRepo, never()).save(any());
    }

    @Test
    void createTag_unknownUser_isNotFound() {
        when(userRepo.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.createTag(9L, request("Work", "blue")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateTag_renamesAndRecolours_ignoringItselfInTheDuplicateCheck() {
        Tag existing = tag(5L, "work", "blue");
        when(tagRepo.findByIdAndUser_Id(5L, 1L)).thenReturn(Optional.of(existing));
        when(tagRepo.existsByUser_IdAndNameIgnoreCaseAndIdNot(1L, "Work", 5L)).thenReturn(false);
        when(tagRepo.save(existing)).thenReturn(existing);
        when(tagRepo.countContactsWithTag(5L)).thenReturn(3L);

        TagDto updated = tagService.updateTag(5L, 1L, request("Work", "teal"));

        assertThat(updated).isEqualTo(new TagDto(5L, "Work", "teal", 3));
    }

    @Test
    void updateTag_toAnotherTagsName_isRejected() {
        when(tagRepo.findByIdAndUser_Id(5L, 1L)).thenReturn(Optional.of(tag(5L, "work", "blue")));
        when(tagRepo.existsByUser_IdAndNameIgnoreCaseAndIdNot(1L, "family", 5L)).thenReturn(true);

        assertThatThrownBy(() -> tagService.updateTag(5L, 1L, request("family", "blue")))
                .isInstanceOf(DuplicateResourceException.class);
        verify(tagRepo, never()).save(any());
    }

    @Test
    void updateTag_otherUsersTag_looksLikeItDoesNotExist() {
        when(tagRepo.findByIdAndUser_Id(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.updateTag(5L, 1L, request("Work", "blue")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTag_deletesOwnTag() {
        Tag existing = tag(5L, "work", "blue");
        when(tagRepo.findByIdAndUser_Id(5L, 1L)).thenReturn(Optional.of(existing));

        tagService.deleteTag(5L, 1L);

        verify(tagRepo).delete(existing);
    }

    @Test
    void deleteTag_otherUsersTag_isNotFoundAndNothingIsDeleted() {
        when(tagRepo.findByIdAndUser_Id(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.deleteTag(5L, 1L)).isInstanceOf(ResourceNotFoundException.class);
        verify(tagRepo, never()).delete(any());
    }
}

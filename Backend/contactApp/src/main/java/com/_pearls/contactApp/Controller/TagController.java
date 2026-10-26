package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.TagDto;
import com._pearls.contactApp.Dto.TagRequest;
import com._pearls.contactApp.Service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The signed-in user's tags (groups such as Family or Work). */
@RestController
@RequestMapping("/tag")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    /** The user's tags, sorted by name, with how many contacts have each. */
    @GetMapping
    public List<TagDto> getTags(@AuthenticationPrincipal AuthUser principal) {
        return tagService.getTags(principal.getId());
    }

    @PostMapping
    public ResponseEntity<TagDto> createTag(@Valid @RequestBody TagRequest request,
            @AuthenticationPrincipal AuthUser principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(principal.getId(), request));
    }

    @PutMapping("/{id}")
    public TagDto updateTag(@PathVariable Long id, @Valid @RequestBody TagRequest request,
            @AuthenticationPrincipal AuthUser principal) {
        return tagService.updateTag(id, principal.getId(), request);
    }

    /** Deletes the tag; the contacts that had it are kept. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id, @AuthenticationPrincipal AuthUser principal) {
        tagService.deleteTag(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}

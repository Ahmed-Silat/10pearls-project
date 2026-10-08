package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Config.AuthUser;
import com._pearls.contactApp.Dto.AuthResponse;
import com._pearls.contactApp.Dto.ChangePasswordRequest;
import com._pearls.contactApp.Dto.LoginRequest;
import com._pearls.contactApp.Dto.SignupRequest;
import com._pearls.contactApp.Dto.UpdateUserRequest;
import com._pearls.contactApp.Dto.UserDto;
import com._pearls.contactApp.ExceptionHandling.ForbiddenException;
import com._pearls.contactApp.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserDto> getUsers() {
        return userService.getUsers();
    }

    /** Returns the logged-in user's own profile; other users' profiles are not accessible. */
    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable String id, @AuthenticationPrincipal AuthUser principal) {
        if (principal == null || !principal.getId().equals(id)) {
            throw new ForbiddenException("You may only view your own profile");
        }
        return userService.getUser(id);
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.signup(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @PutMapping("/{id}")
    public UserDto updateUser(@PathVariable String id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @PutMapping("/changePassword/{id}")
    public ResponseEntity<Map<String, String>> changePassword(@PathVariable String id,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
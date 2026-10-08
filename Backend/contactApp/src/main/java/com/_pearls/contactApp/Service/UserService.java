package com._pearls.contactApp.Service;

import com._pearls.contactApp.Config.JwtService;
import com._pearls.contactApp.Dto.AuthResponse;
import com._pearls.contactApp.Dto.ChangePasswordRequest;
import com._pearls.contactApp.Dto.LoginRequest;
import com._pearls.contactApp.Dto.SignupRequest;
import com._pearls.contactApp.Dto.UpdateUserRequest;
import com._pearls.contactApp.Dto.UserDto;
import com._pearls.contactApp.ExceptionHandling.DuplicateResourceException;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.ExceptionHandling.UnauthorizedException;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import static com._pearls.contactApp.Util.TextUtils.normalize;
import static com._pearls.contactApp.Util.TextUtils.trim;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public List<UserDto> getUsers() {
        return userRepo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUser(String id) {
        return userRepo.findById(id).map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = normalize(request.getEmail());
        if (userRepo.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("A user with this email already exists");
        }
        User user = User.builder()
                .firstName(normalize(request.getFirstName()))
                .lastName(normalize(request.getLastName()))
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(trim(request.getPhone()))
                .address(trim(request.getAddress()))
                .build();
        user = userRepo.save(user);
        log.info("New user signed up: {}", user.getEmail());
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepo.findByEmailIgnoreCase(trim(request.getEmail()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        return toAuthResponse(user);
    }

    @Transactional
    public UserDto updateUser(String id, UpdateUserRequest request) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));

        user.setFirstName(normalize(request.getFirstName()));
        user.setLastName(normalize(request.getLastName()));
        user.setEmail(normalize(request.getEmail()));

        // Optional fields: only overwrite when the request includes them, so omitting
        // one keeps the saved value.
        if (request.getPhone() != null) {
            user.setPhone(trim(request.getPhone()));
        }
        if (request.getAddress() != null) {
            user.setAddress(trim(request.getAddress()));
        }

        return toDto(userRepo.save(user));
    }

    @Transactional
    public void changePassword(String id, ChangePasswordRequest request) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);
        log.info("Password changed for user {}", user.getEmail());
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        return dto;
    }

    private AuthResponse toAuthResponse(User user) {
        AuthResponse response = new AuthResponse();
        response.setToken(jwtService.generateToken(user.getId(), user.getEmail()));
        response.setUser(toDto(user));
        return response;
    }
}
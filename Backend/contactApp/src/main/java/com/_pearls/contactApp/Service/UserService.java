package com._pearls.contactApp.Service;

import com._pearls.contactApp.Config.JwtService;
import com._pearls.contactApp.Dto.AuthResponse;
import com._pearls.contactApp.Dto.ChangePasswordRequest;
import com._pearls.contactApp.Dto.LoginRequest;
import com._pearls.contactApp.Dto.SignupRequest;
import com._pearls.contactApp.Dto.UpdateUserRequest;
import com._pearls.contactApp.Dto.UserDto;
import com._pearls.contactApp.ExceptionHandling.BadRequestException;
import com._pearls.contactApp.ExceptionHandling.DuplicateResourceException;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.ExceptionHandling.UnauthorizedException;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.UserRepo;
import com._pearls.contactApp.Util.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;


import static com._pearls.contactApp.Util.TextUtils.normalize;
import static com._pearls.contactApp.Util.TextUtils.trim;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    static final String TOO_MANY_LOGINS = "Too many login attempts for this email. Please wait 15 minutes and try again.";
    static final int MAX_LOGINS_PER_WINDOW = 10;
    static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RateLimiter rateLimiter;

    private volatile String dummyHash;

    @Transactional(readOnly = true)
    public UserDto getUser(Long id) {
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
        String email = trim(request.getEmail());
        // Counted per email whether or not it has an account, so hitting the limit reveals nothing.
        rateLimiter.check("login:" + normalize(email), MAX_LOGINS_PER_WINDOW, LOGIN_WINDOW, TOO_MANY_LOGINS);

        Optional<User> user = userRepo.findByEmailIgnoreCase(email);
        // Check a password even when the email is unknown, so the response time doesn't reveal which emails
        // have accounts.
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(),
                user.map(User::getPassword).orElseGet(this::dummyHash));
        if (user.isEmpty() || !passwordMatches) {
            throw new UnauthorizedException("Invalid email or password");
        }
        return toAuthResponse(user.get());
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));

        String newEmail = normalize(request.getEmail());
        // The email is where reset codes go, so someone holding a stolen session must not be able to change it.
        if (!newEmail.equalsIgnoreCase(user.getEmail())) {
            requireCurrentPassword(user, request.getCurrentPassword(),
                    "Enter your current password to change your email");
        }

        user.setFirstName(normalize(request.getFirstName()));
        user.setLastName(normalize(request.getLastName()));
        user.setEmail(newEmail);

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

    /**
     * Changes the password and signs out every other session. Returns a fresh token so the session that made
     * the change stays signed in.
     */
    @Transactional
    public AuthResponse changePassword(Long id, ChangePasswordRequest request) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));

        requireCurrentPassword(user, request.getCurrentPassword(), "Current password is required");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(Instant.now());
        user = userRepo.save(user);
        log.info("Password changed for user {}", user.getEmail());
        return toAuthResponse(user);
    }

    /**
     * 400 rather than 401 on a wrong password: the session itself is fine, and the frontend treats any 401 as
     * "session expired" and signs the user out.
     */
    private void requireCurrentPassword(User user, String currentPassword, String messageWhenMissing) {
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new BadRequestException(messageWhenMissing);
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
    }

    /** A real hash of a random value, checked against for unknown emails so that path isn't faster. */
    private String dummyHash() {
        if (dummyHash == null) {
            dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
        }
        return dummyHash;
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
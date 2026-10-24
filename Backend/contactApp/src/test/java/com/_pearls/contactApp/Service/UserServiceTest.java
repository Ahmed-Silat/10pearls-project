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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private RateLimiter rateLimiter;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .firstName("Ahmed")
                .lastName("Silat")
                .email("ahmed@example.com")
                .password("hashed-old")
                .phone("0324-2701482")
                .address("Dhoraji")
                .build();
    }

    @Test
    void getUser_unknownId_throwsNotFound() {
        when(userRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUser(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    void signup_encodesPasswordAndReturnsToken() {
        SignupRequest request = new SignupRequest();
        request.setFirstName("Test");
        request.setLastName("User");
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setPhone("0300");
        request.setAddress("London");

        when(userRepo.existsByEmailIgnoreCase("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepo.save(any(User.class))).thenAnswer(inv -> {
            User saved = inv.getArgument(0);
            saved.setId(2L);
            return saved;
        });
        when(jwtService.generateToken(anyLong(), anyString())).thenReturn("jwt-token");

        AuthResponse response = userService.signup(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");

        verify(userRepo).save(any(User.class));
        org.mockito.Mockito.verify(userRepo).save(org.mockito.ArgumentMatchers.argThat(saved ->
                "hashed".equals(((User) saved).getPassword())));
    }

    @Test
    void signup_trimsAndLowerCasesNameAndEmail() {
        SignupRequest request = new SignupRequest();
        request.setFirstName("  Ahmed ");
        request.setLastName(" SILAT  ");
        request.setEmail("  Ahmed@Example.COM ");
        request.setPassword("password123");
        request.setPhone(" 0300 ");
        request.setAddress(" Karachi ");

        when(userRepo.existsByEmailIgnoreCase("ahmed@example.com")).thenReturn(false);
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = userService.signup(request);

        UserDto saved = response.getUser();
        assertThat(saved.getFirstName()).isEqualTo("ahmed");
        assertThat(saved.getLastName()).isEqualTo("silat");
        assertThat(saved.getEmail()).isEqualTo("ahmed@example.com");
        assertThat(saved.getPhone()).isEqualTo("0300");
        assertThat(saved.getAddress()).isEqualTo("Karachi");
    }

    @Test
    void login_matchesEmailIgnoringCaseAndSpaces() {
        LoginRequest request = new LoginRequest();
        request.setEmail("  Ahmed@Example.com ");
        request.setPassword("plain");

        when(userRepo.findByEmailIgnoreCase("Ahmed@Example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("plain", "hashed-old")).thenReturn(true);

        AuthResponse response = userService.login(request);

        assertThat(response.getUser().getId()).isEqualTo(1L);
    }

    @Test
    void signup_duplicateEmail_throwsConflict() {
        SignupRequest request = new SignupRequest();
        request.setEmail("ahmed@example.com");

        when(userRepo.existsByEmailIgnoreCase("ahmed@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.signup(request))
                .isInstanceOf(DuplicateResourceException.class);
        verify(userRepo, never()).save(any());
    }

    @Test
    void login_validCredentials_returnsToken() {
        LoginRequest request = new LoginRequest();
        request.setEmail("ahmed@example.com");
        request.setPassword("plain");

        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("plain", "hashed-old")).thenReturn(true);
        when(jwtService.generateToken(1L, "ahmed@example.com")).thenReturn("jwt");

        AuthResponse response = userService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt");
        assertThat(response.getUser().getId()).isEqualTo(1L);
    }

    @Test
    void login_unknownEmail_throwsUnauthorized() {
        LoginRequest request = new LoginRequest();
        request.setEmail("ghost@example.com");
        request.setPassword("x");

        when(userRepo.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    void login_wrongPassword_throwsUnauthorized() {
        LoginRequest request = new LoginRequest();
        request.setEmail("ahmed@example.com");
        request.setPassword("wrong");

        when(userRepo.findByEmailIgnoreCase("ahmed@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed-old")).thenReturn(false);

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void updateUser_mapsFieldsAndNeverChangesPassword() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("New");
        request.setLastName("Name");
        request.setEmail("ahmed@example.com");
        request.setPhone("0300");
        request.setAddress("Karachi");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto result = userService.updateUser(1L, request);

        assertThat(result.getFirstName()).isEqualTo("new");
        assertThat(result.getPhone()).isEqualTo("0300");
        assertThat(user.getPassword()).isEqualTo("hashed-old");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepo).save(user);
    }

    @Test
    void updateUser_trimsAndLowerCasesNameAndEmail() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName(" NEW ");
        request.setLastName("  Name");
        request.setEmail(" Ahmed@Example.com  ");
        request.setPhone(" 0300 ");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(1L, request);

        assertThat(user.getFirstName()).isEqualTo("new");
        assertThat(user.getLastName()).isEqualTo("name");
        assertThat(user.getEmail()).isEqualTo("ahmed@example.com");
        assertThat(user.getPhone()).isEqualTo("0300");
    }

    @Test
    void updateUser_withoutPhoneAndAddress_keepsSavedValues() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("New");
        request.setLastName("Name");
        request.setEmail("ahmed@example.com");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(1L, request);

        assertThat(user.getPhone()).isEqualTo("0324-2701482");
        assertThat(user.getAddress()).isEqualTo("Dhoraji");
    }

    @Test
    void updateUser_withEmptyPhoneAndAddress_clearsThem() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("New");
        request.setLastName("Name");
        request.setEmail("ahmed@example.com");
        request.setPhone("");
        request.setAddress("");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(1L, request);

        assertThat(user.getPhone()).isEmpty();
        assertThat(user.getAddress()).isEmpty();
    }

    @Test
    void changePassword_wrongCurrentPassword_isA400NotA401() {
        // A 401 would make the frontend think the session expired and sign the user out.
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrong");
        request.setNewPassword("newPassword123");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed-old")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Current password is incorrect");
        assertThat(user.getPassword()).isEqualTo("hashed-old");
        verify(userRepo, never()).save(any());
    }

    @Test
    void changePassword_success_savesSignsOutOtherSessionsAndReturnsFreshToken() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old");
        request.setNewPassword("newPassword123");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old", "hashed-old")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("hashed-new");
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(1L, "ahmed@example.com")).thenReturn("fresh-jwt");
        Instant before = Instant.now();

        AuthResponse response = userService.changePassword(1L, request);

        assertThat(user.getPassword()).isEqualTo("hashed-new");
        assertThat(user.getPasswordChangedAt()).isNotNull().isAfterOrEqualTo(before);
        assertThat(response.getToken()).isEqualTo("fresh-jwt");
        verify(userRepo).save(user);
    }

    @Test
    void updateUser_changingEmailWithoutPassword_isRejected() {
        UpdateUserRequest request = profileUpdate("new@example.com");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.updateUser(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Enter your current password to change your email");
        assertThat(user.getEmail()).isEqualTo("ahmed@example.com");
        verify(userRepo, never()).save(any());
    }

    @Test
    void updateUser_changingEmailWithWrongPassword_isRejected() {
        UpdateUserRequest request = profileUpdate("new@example.com");
        request.setCurrentPassword("wrong");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed-old")).thenReturn(false);

        assertThatThrownBy(() -> userService.updateUser(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Current password is incorrect");
        assertThat(user.getEmail()).isEqualTo("ahmed@example.com");
    }

    @Test
    void updateUser_changingEmailWithCorrectPassword_savesIt() {
        UpdateUserRequest request = profileUpdate("New@Example.com");
        request.setCurrentPassword("old");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old", "hashed-old")).thenReturn(true);
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(1L, request);

        assertThat(user.getEmail()).isEqualTo("new@example.com");
    }

    @Test
    void updateUser_emailTakenByAnotherUser_saysSoClearly() {
        UpdateUserRequest request = profileUpdate("taken@example.com");
        request.setCurrentPassword("old");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old", "hashed-old")).thenReturn(true);
        when(userRepo.existsByEmailIgnoreCaseAndIdNot("taken@example.com", 1L)).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUser(1L, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("A user with this email already exists");
        verify(userRepo, never()).save(any());
    }

    @Test
    void getUser_includesTheSignUpDate() {
        user.setCreatedAt(Instant.parse("2026-01-15T10:00:00Z"));
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        assertThat(userService.getUser(1L).getCreatedAt()).isEqualTo("2026-01-15T10:00:00Z");
    }

    @Test
    void updateUser_sameEmailInDifferentCase_needsNoPassword() {
        UpdateUserRequest request = profileUpdate("AHMED@example.com");

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(1L, request);

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_isRateLimitedPerEmail() {
        LoginRequest request = new LoginRequest();
        request.setEmail(" Ahmed@Example.com ");
        request.setPassword("x");

        when(userRepo.findByEmailIgnoreCase("Ahmed@Example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.login(request)).isInstanceOf(UnauthorizedException.class);

        verify(rateLimiter).check(eq("login:ahmed@example.com"), eq(UserService.MAX_LOGINS_PER_WINDOW),
                eq(UserService.LOGIN_WINDOW), anyString());
    }

    @Test
    void login_unknownEmail_stillChecksAPassword() {
        // Otherwise unknown emails would be answered faster, revealing which emails have accounts.
        LoginRequest request = new LoginRequest();
        request.setEmail("ghost@example.com");
        request.setPassword("guess");

        when(userRepo.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("dummy-hash");

        assertThatThrownBy(() -> userService.login(request)).isInstanceOf(UnauthorizedException.class);

        verify(passwordEncoder).matches("guess", "dummy-hash");
    }

    private static UpdateUserRequest profileUpdate(String email) {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("Ahmed");
        request.setLastName("Silat");
        request.setEmail(email);
        return request;
    }
}
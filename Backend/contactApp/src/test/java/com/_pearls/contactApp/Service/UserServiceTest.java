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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id("user-1")
                .firstName("Ahmed")
                .lastName("Silat")
                .email("ahmed@example.com")
                .password("hashed-old")
                .phone("0324-2701482")
                .address("Dhoraji")
                .build();
    }

    @Test
    void getUsers_returnsDtosWithoutPassword() {
        when(userRepo.findAll()).thenReturn(List.of(user));

        List<UserDto> result = userService.getUsers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("user-1");
    }

    @Test
    void getUser_unknownId_throwsNotFound() {
        when(userRepo.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUser("missing"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("missing");
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
            saved.setId("user-2");
            return saved;
        });
        when(jwtService.generateToken(anyString(), anyString())).thenReturn("jwt-token");

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

        assertThat(response.getUser().getId()).isEqualTo("user-1");
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
        when(jwtService.generateToken("user-1", "ahmed@example.com")).thenReturn("jwt");

        AuthResponse response = userService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt");
        assertThat(response.getUser().getId()).isEqualTo("user-1");
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
        request.setEmail("new@example.com");
        request.setPhone("0300");
        request.setAddress("Karachi");

        when(userRepo.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto result = userService.updateUser("user-1", request);

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
        request.setEmail(" New@Example.com  ");
        request.setPhone(" 0300 ");

        when(userRepo.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser("user-1", request);

        assertThat(user.getFirstName()).isEqualTo("new");
        assertThat(user.getLastName()).isEqualTo("name");
        assertThat(user.getEmail()).isEqualTo("new@example.com");
        assertThat(user.getPhone()).isEqualTo("0300");
    }

    @Test
    void updateUser_withoutPhoneAndAddress_keepsSavedValues() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("New");
        request.setLastName("Name");
        request.setEmail("new@example.com");

        when(userRepo.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser("user-1", request);

        assertThat(user.getPhone()).isEqualTo("0324-2701482");
        assertThat(user.getAddress()).isEqualTo("Dhoraji");
    }

    @Test
    void updateUser_withEmptyPhoneAndAddress_clearsThem() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("New");
        request.setLastName("Name");
        request.setEmail("new@example.com");
        request.setPhone("");
        request.setAddress("");

        when(userRepo.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser("user-1", request);

        assertThat(user.getPhone()).isEmpty();
        assertThat(user.getAddress()).isEmpty();
    }

    @Test
    void changePassword_wrongCurrentPassword_throwsUnauthorized() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrong");
        request.setNewPassword("newPassword123");

        when(userRepo.findById("user-1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed-old")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword("user-1", request))
                .isInstanceOf(UnauthorizedException.class);
        assertThat(user.getPassword()).isEqualTo("hashed-old");
        verify(userRepo, never()).save(any());
    }

    @Test
    void changePassword_success_encodesAndSaves() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old");
        request.setNewPassword("newPassword123");

        when(userRepo.findById("user-1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old", "hashed-old")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("hashed-new");

        userService.changePassword("user-1", request);

        assertThat(user.getPassword()).isEqualTo("hashed-new");
        verify(userRepo).save(user);
    }
}
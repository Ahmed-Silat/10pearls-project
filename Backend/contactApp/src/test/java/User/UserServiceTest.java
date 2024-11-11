package User;

import com._pearls.contactApp.Dto.ChangePasswordDto;
import com._pearls.contactApp.Dto.LoginDto;
import com._pearls.contactApp.Dto.SignupDto;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.UserRepo;
import com._pearls.contactApp.Service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

@RunWith(MockitoJUnitRunner.class)
public class UserServiceTest {

    private MockMvc mockMvc;

    ObjectMapper objectMapper = new ObjectMapper();
    ObjectWriter objectWriter = objectMapper.writer();

    @Mock
    private UserRepo userRepo;

    @InjectMocks
    private UserService userService;

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        this.mockMvc = MockMvcBuilders.standaloneSetup(userService).build();
    }

    @Test
    public void getAllUsers_success() throws Exception {

        User user1 = new User("4515e026-d1ef-4ef4-85f0-4fbb6ac17284", "Rimsha", "Ajmal", "rimshaAjmal2001@gmail", "rimsha123", "0336-1132916", "Jauhar");
        User user2 = new User("df6004a8-5bb5-4374-b858-983c5613719e", "Ahmed", "Silat", "ahmedsilat@gmail.com", "ahmed", "0324-2701482", "Dhoraji");


        List<User> mockUsers = new ArrayList<>(Arrays.asList(user1, user2));

        Mockito.when(userRepo.findAll()).thenReturn(mockUsers);

        List<User> result = userService.getUsers();


        assertEquals(2, result.size());
        assertEquals("Rimsha", result.get(0).getFirstName());
        assertEquals("Ahmed", result.get(1).getFirstName());
    }

    @Test
    public void createUser_success() throws Exception {
        User testUser = User.builder()
                .firstName("Test")
                .lastName("User")
                .email("testUser@gmail.com")
                .password("test123")
                .phone("0324-2701482")
                .address("London")
                .build();

        Mockito.when(userRepo.save(testUser)).thenReturn(testUser);

        User result = userService.createUser(testUser);

        assertEquals(testUser, result);
        assertEquals("Test", result.getFirstName());
        assertEquals("User", result.getLastName());

        verify(userRepo).save(testUser);
    }

    @Test
    public void updateUser_success() throws Exception {
        String userId = "1";
        User existingUser = User.builder()
                .id(userId)
                .firstName("OldFirstName")
                .lastName("OldLastName")
                .email("oldEmail@gmail.com")
                .password("oldPass")
                .phone("0324-2701482")
                .address("OldAddress")
                .build();

        User updatedUserData = User.builder()
                .id(userId)
                .firstName("NewFirstName")
                .lastName("NewLastName")
                .email("NewEmail@gmail.com")
                .password("NewPass")
                .phone("0333-1234567")
                .address("NewAddress")
                .build();

        Mockito.when(userRepo.findById(userId)).thenReturn(Optional.of(existingUser));

        Mockito.when(userRepo.save(Mockito.any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.updateUser(updatedUserData, userId);

        assertEquals("NewFirstName", result.getFirstName());
        assertEquals("NewLastName", result.getLastName());
        assertEquals("NewEmail@gmail.com", result.getEmail());
        assertEquals("NewPass", result.getPassword());
        assertEquals("0333-1234567", result.getPhone());
        assertEquals("NewAddress", result.getAddress());

        verify(userRepo).findById(userId);
        verify(userRepo).save(existingUser);
    }

    @Test
    public void checkEmailPassword_success() throws Exception {
        LoginDto loginDto = new LoginDto("testUser@gmail.com", "test123");
        User existingUser = new User("1", "Test", "User", "testUser@gmail.com", "test123", "0324-2701482", "London");

        Mockito.when(userRepo.findByEmail(loginDto.getEmail())).thenReturn(Optional.of(existingUser));

        SignupDto result = userService.checkEmailPassword(loginDto);

        assertNotNull(result);
        assertEquals("1", result.getId());
        assertEquals("Test", result.getFirstName());
        assertEquals("User", result.getLastName());
        assertEquals("testUser@gmail.com", result.getEmail());
        assertEquals("0324-2701482", result.getPhone());
        assertEquals("London", result.getAddress());
    }

    @Test
    public void checkEmailPassword_userNotFound() {
        LoginDto loginDto = new LoginDto("unknown@gmail.com", "test123");

        Mockito.when(userRepo.findByEmail(loginDto.getEmail())).thenReturn(Optional.empty());

        Exception exception = assertThrows(Exception.class, () -> {
            userService.checkEmailPassword(loginDto);
        });

        assertEquals("User Does not exist", exception.getMessage());
    }

    @Test
    public void checkEmailPassword_incorrectPassword() {
        LoginDto loginDto = new LoginDto("testUser@gmail.com", "wrongPassword");
        User existingUser = new User("1", "Test", "User", "testUser@gmail.com", "test123", "0324-2701482", "London");

        Mockito.when(userRepo.findByEmail(loginDto.getEmail())).thenReturn(Optional.of(existingUser));

        Exception exception = assertThrows(Exception.class, () -> {
            userService.checkEmailPassword(loginDto);
        });

        assertEquals("Password is not correct", exception.getMessage());
    }

    @Test
    public void changePassword_success() {
        String userId = "1";
        User user = new User("1", "Test", "User", "testUser@gmail.com", "oldPassword", "0324-2701482", "London");
        ChangePasswordDto changePasswordDto = new ChangePasswordDto("oldPassword", "newPassword");

        Mockito.when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        ChangePasswordDto result = userService.changePassword(userId, changePasswordDto);

        assertNotNull(result);
        assertEquals("newPassword", user.getPassword());
        assertEquals(changePasswordDto, result);
    }

    @Test
    public void changePassword_incorrectCurrentPassword() {
        String userId = "1";
        User user = new User("1", "Test", "User", "testUser@gmail.com", "oldPassword", "0324-2701482", "London");
        ChangePasswordDto changePasswordDto = new ChangePasswordDto("incorrectPassword", "newPassword");

        Mockito.when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        ChangePasswordDto result = userService.changePassword(userId, changePasswordDto);

        assertNull(result);
        assertEquals("oldPassword", user.getPassword());
    }

}

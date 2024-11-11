package User;

import com._pearls.contactApp.Controller.UserController;
import com._pearls.contactApp.Dto.ChangePasswordDto;
import com._pearls.contactApp.Dto.LoginDto;
import com._pearls.contactApp.Dto.SignupDto;
import com._pearls.contactApp.Model.User;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(MockitoJUnitRunner.class)
public class UserControllerTest {

    private MockMvc mockMvc;

    ObjectMapper objectMapper = new ObjectMapper();
    ObjectWriter objectWriter = objectMapper.writer();

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    User Record_1 = new User("d1f23234-0c68-4301-bd07-93f976bd470a", "Shoaib", "Silat", "shoaibsilat9@gmail.com", "shoaib123", "0336-7887046", "Dhoraji");
    User Record_2 = new User("4515e026-d1ef-4ef4-85f0-4fbb6ac17284", "Rimsha", "Ajmal", "rimshaAjmal2001@gmail", "rimsha123", "0336-1132916", "Jauhar");
    User Record_3 = new User("df6004a8-5bb5-4374-b858-983c5613719e", "Ahmed", "Silat", "ahmedsilat@gmail.com", "ahmed", "0324-2701482", "Dhoraji");

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        this.mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    @Test
    public void getAllUsers_success() throws Exception {
        List<User> records = new ArrayList<>(Arrays.asList(Record_1, Record_2, Record_3));

        Mockito.when(userService.getUsers()).thenReturn(records);

        mockMvc.perform(MockMvcRequestBuilders
                .get("/user")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$",hasSize(3)))
                .andExpect(jsonPath("$[2].firstName",is("Ahmed")));
    }

    @Test
    public void createUser_success() throws Exception {
        User record = User.builder()
                .firstName("Test")
                .lastName("User")
                .email("testUser@gmail.com")
                .password("test123")
                .phone("0324-2701482")
                .address("London")
                .build();

//        Mockito.when(userService.createUser(record)).thenReturn(record);

        Mockito.when(userService.createUser(Mockito.any(User.class))).thenReturn(record);

        String content = objectWriter.writeValueAsString((record));

        MockHttpServletRequestBuilder mockRequest=MockMvcRequestBuilders
                .post("/user")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(content);

        mockMvc.perform(mockRequest)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.firstName", is("Test")));
    }

    @Test
    public void checkEmailPassword_success() throws Exception {
        LoginDto loginDto = new LoginDto("testUser@gmail.com", "test123");
        SignupDto expectedResponse = new SignupDto("1", "Test", "User", "testUser@gmail.com","0324-2701482","Dhoraji");

        Mockito.when(userService.checkEmailPassword(Mockito.any(LoginDto.class))).thenReturn(expectedResponse);

        String content = objectWriter.writeValueAsString(loginDto);

        MockHttpServletRequestBuilder mockRequest = MockMvcRequestBuilders.post("/user/login")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(content);

        mockMvc.perform(mockRequest)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.id", is("1")))
                .andExpect(jsonPath("$.firstName", is("Test")))
                .andExpect(jsonPath("$.lastName", is("User")))
                .andExpect(jsonPath("$.email", is("testUser@gmail.com")))
                .andExpect(jsonPath("$.phone", is("0324-2701482")))
                .andExpect(jsonPath("$.address", is("Dhoraji")));
    }

    @Test
    public void updateUser_success() throws Exception {
        String userId = "1";
        User updatedUser = User.builder()
                .id(userId)
                .firstName("UpdatedFirstName")
                .lastName("UpdatedLastName")
                .email("updatedEmail@gmail.com")
                .password("updatedPassword")
                .phone("0324-2701482")
                .address("Updated Address")
                .build();

        Mockito.when(userService.updateUser(Mockito.any(User.class), Mockito.eq(userId))).thenReturn(updatedUser);

        String content = objectWriter.writeValueAsString(updatedUser);

        MockHttpServletRequestBuilder mockRequest = MockMvcRequestBuilders
                .put("/user/{id}", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(content);

        mockMvc.perform(mockRequest)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.id", is(userId)))
                .andExpect(jsonPath("$.firstName", is("UpdatedFirstName")))
                .andExpect(jsonPath("$.lastName", is("UpdatedLastName")))
                .andExpect(jsonPath("$.email", is("updatedEmail@gmail.com")))
                .andExpect(jsonPath("$.address", is("Updated Address")));
    }

    @Test
    public void changePassword_success() throws Exception {
        ChangePasswordDto requestDto = new ChangePasswordDto("oldPassword123", "newPassword456");
        ChangePasswordDto expectedResponse = new ChangePasswordDto("oldPassword123", "newPassword456");

        Mockito.when(userService.changePassword(Mockito.eq("1"), Mockito.any(ChangePasswordDto.class)))
                .thenReturn(expectedResponse);

        String content = objectWriter.writeValueAsString(requestDto);

        MockHttpServletRequestBuilder mockRequest = MockMvcRequestBuilders.put("/user/changePassword/1")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(content);

        mockMvc.perform(mockRequest)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.currentPassword", is("oldPassword123")))
                .andExpect(jsonPath("$.newPassword", is("newPassword456")));
    }

}

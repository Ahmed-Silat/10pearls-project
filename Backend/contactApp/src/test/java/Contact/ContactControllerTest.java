package Contact;

import com._pearls.contactApp.Controller.ContactController;
import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.FilterContactDto;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Service.ContactService;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(MockitoJUnitRunner.class)
public class ContactControllerTest {

    private MockMvc mockMvc;

    ObjectMapper objectMapper = new ObjectMapper();
    ObjectWriter objectWriter = objectMapper.writer();

    @Mock
    private ContactService contactService;

    @InjectMocks
    private ContactController contactController;

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        this.mockMvc = MockMvcBuilders.standaloneSetup(contactController).build();
    }

    Contact contact1 = new Contact("db3d33c5-8ffa-4dcb-9d13-8e6a4446f35e", "ahmar", "Silat",
            "ahmer@gmail.com", "03343504685", "490 Block C",
            new User("df6004a8-5bb5-4374-b858-983c5613719e", "Ahmed", "Silat",
                    "ahmedsilat@gmail.com", "ahmed", "0324-2701482", "Dhoraji"));

    Contact contact2 = new Contact("c1f58c0e-ae50-4f6f-b22a-1c63d0153ee8", "Rimsha", "Ajmal",
            "rimsha2001@gmail.com", "0336-1132916", "Jauhar",
            new User("df6004a8-5bb5-4374-b858-983c5613719e", "Ahmed", "Silat",
                    "ahmedsilat@gmail.com", "ahmed", "0324-2701482", "Dhoraji"));

    @Test
    public void getContactByContactId_success() throws Exception {

        String contactId = "db3d33c5-8ffa-4dcb-9d13-8e6a4446f35e";


        Mockito.when(contactService.getContactsByContactId(contactId)).thenReturn(Optional.of(contact1));

        mockMvc.perform(MockMvcRequestBuilders
                        .get("/contact/{id}", contactId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.id", is("db3d33c5-8ffa-4dcb-9d13-8e6a4446f35e")))
                .andExpect(jsonPath("$.firstName", is("ahmar")))
                .andExpect(jsonPath("$.lastName", is("Silat")))
                .andExpect(jsonPath("$.email", is("ahmer@gmail.com")))
                .andExpect(jsonPath("$.phone", is("03343504685")))
                .andExpect(jsonPath("$.address", is("490 Block C")));

    }

    @Test
    public void getContactsByUserId_success() throws Exception {
        String userId = "df6004a8-5bb5-4374-b858-983c5613719e";
        String search = "Rimsha";
        String sortBy = "A-Z";
        int page = 1;
        int size = 2;

        List<Contact> contactList = new ArrayList<>(Arrays.asList(contact1, contact2));


        Mockito.when(contactService.getContactsByUserId(eq(userId), eq(search), any(FilterContactDto.class), eq(page), eq(size))).thenReturn((contactList));

        mockMvc.perform(MockMvcRequestBuilders
                        .get("/contact/user/{id}", userId)
                        .param("search", search)
                        .param("sortBy", search)
                        .param("page", String.valueOf(page))
                        .param("size", String.valueOf(size))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].firstName", is("ahmar")))
                .andExpect(jsonPath("$[1].firstName", is("Rimsha")));


    }

    @Test
    public void CreateContact_success() throws Exception {
        Contact record = Contact.builder()
                .firstName("Test")
                .lastName("User")
                .email("testUser@gmail.com")
                .phone("0324-2701482")
                .address("London")
                .user(new User("df6004a8-5bb5-4374-b858-983c5613719e", "Ahmed", "Silat",
                        "ahmedsilat@gmail.com", "ahmed", "0324-2701482", "Dhoraji"))
                .build();


        Mockito.when(contactService.createContact(Mockito.any(ContactDto.class))).thenReturn(record);

        String content = objectWriter.writeValueAsString((record));

        MockHttpServletRequestBuilder mockRequest = MockMvcRequestBuilders
                .post("/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(content);

        mockMvc.perform(mockRequest)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.firstName", is("Test")));
    }

    @Test
    public void updateContact_success() throws Exception {
        String contactId = "1";
        Contact updatedContact = Contact.builder()
                .id(contactId)
                .firstName("UpdatedFirstName")
                .lastName("UpdatedLastName")
                .email("updatedEmail@gmail.com")
                .phone("0324-2701482")
                .address("Updated Address")
                .build();

        Mockito.when(contactService.updateContact(Mockito.eq(contactId),Mockito.any(ContactDto.class))).thenReturn(updatedContact);

        String content = objectWriter.writeValueAsString(updatedContact);

        MockHttpServletRequestBuilder mockRequest = MockMvcRequestBuilders
                .put("/contact/{id}", contactId)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(content);

        mockMvc.perform(mockRequest)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.id", is(contactId)))
                .andExpect(jsonPath("$.firstName", is("UpdatedFirstName")))
                .andExpect(jsonPath("$.lastName", is("UpdatedLastName")))
                .andExpect(jsonPath("$.email", is("updatedEmail@gmail.com")))
                .andExpect(jsonPath("$.address", is("Updated Address")));
    }

    @Test
    public void deleteContact_success() throws Exception {
        String contactId = "db3d33c5-8ffa-4dcb-9d13-8e6a4446f35e";

        Mockito.when(contactService.deleteContact(contactId)).thenReturn(contact1);

        mockMvc.perform(MockMvcRequestBuilders
                        .delete("/contact/{id}",contactId)
                .contentType(MediaType.APPLICATION_JSON))

                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.id", is(contactId)))
                .andExpect(jsonPath("$.firstName", is("ahmar")))
                .andExpect(jsonPath("$.lastName", is("Silat")))
                .andExpect(jsonPath("$.email", is("ahmer@gmail.com")))
                .andExpect(jsonPath("$.address", is("490 Block C")));
    }

}

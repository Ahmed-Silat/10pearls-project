package Contact;

import com._pearls.contactApp.Dto.ContactDto;
import com._pearls.contactApp.Dto.FilterContactDto;
import com._pearls.contactApp.Model.Contact;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.ContactRepo;
import com._pearls.contactApp.Repo.UserRepo;
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
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@RunWith(MockitoJUnitRunner.class)
public class ContactServiceTest {

    private MockMvc mockMvc;

    ObjectMapper objectMapper = new ObjectMapper();
    ObjectWriter objectWriter = objectMapper.writer();

    @Mock
    private ContactRepo contactRepo;

    @Mock
    private UserRepo userRepo;

    @InjectMocks
    private ContactService contactService;

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        this.mockMvc = MockMvcBuilders.standaloneSetup(contactService).build();
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
    public void getContactsByContactId() throws Exception {

        String contactId = "db3d33c5-8ffa-4dcb-9d13-8e6a4446f35e";

        Mockito.when(contactRepo.findAllById(contactId)).thenReturn(Optional.of(contact1));

        Optional<Contact> result = contactService.getContactsByContactId(contactId);

        assertTrue(result.isPresent());
        assertEquals("ahmar", result.get().getFirstName());
        assertEquals("Silat", result.get().getLastName());
    }

    @Test
    public void getContactsByUserId_withoutSearch() throws Exception {

        List<Contact> contactList = new ArrayList<>(Arrays.asList(contact1, contact2));

        String userId = "df6004a8-5bb5-4374-b858-983c5613719e";
        FilterContactDto filterContactDto = new FilterContactDto();
        filterContactDto.setSortBy("A-Z");

        Mockito.when(contactRepo.findAllByUser_Id(eq(userId), any(Pageable.class))).thenReturn(contactList);

        List<Contact> result = contactService.getContactsByUserId(userId, null, filterContactDto, 1, 10);

        assertEquals(2, result.size());
        assertEquals("Rimsha", result.get(1).getFirstName());
    }

    @Test
    public void getContactsByUserId_withSearch() throws Exception {

        List<Contact> contactList = new ArrayList<>(Arrays.asList(contact1, contact2));

        String userId = "df6004a8-5bb5-4374-b858-983c5613719e";
        FilterContactDto filterContactDto = new FilterContactDto();
        filterContactDto.setSortBy("A-Z");
        String search = "Rimsha";

        Mockito.when(contactRepo.findAllByUserIdAndSearch(eq(userId), eq(search), any(Pageable.class))).thenReturn(contactList);

        List<Contact> result = contactService.getContactsByUserId(userId, search, filterContactDto, 1, 10);

        assertEquals(2, result.size());
        assertEquals("Rimsha", result.get(1).getFirstName());
    }

    @Test
    public void createContact_success() throws Exception {
        ContactDto contactDto = new ContactDto();
        contactDto.setFirstName("John");
        contactDto.setLastName("Doe");
        contactDto.setEmail("johndoe@example.com");
        contactDto.setPhone("123-456-7890");
        contactDto.setAddress("123 Main St");
        contactDto.setUser_id("user123");

        User mockUser = new User();
        mockUser.setId("user123");

        Mockito.when(userRepo.findById("user123")).thenReturn(Optional.of(mockUser));

        Contact mockContact = new Contact();
        mockContact.setFirstName(contactDto.getFirstName());
        mockContact.setLastName(contactDto.getLastName());
        mockContact.setEmail(contactDto.getEmail());
        mockContact.setPhone(contactDto.getPhone());
        mockContact.setAddress(contactDto.getAddress());
        mockContact.setUser(mockUser);

        Mockito.when(contactRepo.save(any(Contact.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Contact createdContact = contactService.createContact(contactDto);

        assertEquals("John", createdContact.getFirstName());
        assertEquals("Doe", createdContact.getLastName());
        assertEquals("johndoe@example.com", createdContact.getEmail());
        assertEquals("123-456-7890", createdContact.getPhone());
        assertEquals("123 Main St", createdContact.getAddress());
        assertEquals(mockUser, createdContact.getUser());

        verify(userRepo).findById("user123");
        verify(contactRepo).save(any(Contact.class));
    }


    @Test
    public void testUpdateContact() {
        String contactId = "contact123";
        ContactDto contactDto = new ContactDto();
        contactDto.setFirstName("Jane");
        contactDto.setLastName("Doe");
        contactDto.setEmail("janedoe@example.com");
        contactDto.setPhone("987-654-3210");
        contactDto.setAddress("456 Another St");
        contactDto.setUser_id("user123");

        User mockUser = new User();
        mockUser.setId("user123");

        Contact existingContact = new Contact();
        existingContact.setId(contactId);
        existingContact.setFirstName("John");
        existingContact.setLastName("Smith");
        existingContact.setEmail("johnsmith@example.com");
        existingContact.setPhone("123-456-7890");
        existingContact.setAddress("123 Main St");

        Mockito.when(contactRepo.findById(contactId)).thenReturn(Optional.of(existingContact));
        Mockito.when(userRepo.findById("user123")).thenReturn(Optional.of(mockUser));
        Mockito.when(contactRepo.save(any(Contact.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Contact updatedContact = contactService.updateContact(contactId, contactDto);

        assertEquals("Jane", updatedContact.getFirstName());
        assertEquals("Doe", updatedContact.getLastName());
        assertEquals("janedoe@example.com", updatedContact.getEmail());
        assertEquals("987-654-3210", updatedContact.getPhone());
        assertEquals("456 Another St", updatedContact.getAddress());
        assertEquals(mockUser, updatedContact.getUser());

        verify(contactRepo).findById(contactId);
        verify(userRepo).findById("user123");
        verify(contactRepo).save(existingContact);
    }

    @Test
    public void testDeleteContact_ContactExists() {
        String contactId = "contact123";
        Contact existingContact = new Contact();
        existingContact.setId(contactId);
        existingContact.setFirstName("John");
        existingContact.setLastName("Doe");

        Mockito.when(contactRepo.findById(contactId)).thenReturn(Optional.of(existingContact));
        Mockito.when(contactRepo.save(any(Contact.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Contact deletedContact = contactService.deleteContact(contactId);


        assertEquals(existingContact, deletedContact);
        assertNull(deletedContact.getUser());  // Verify user is set to null
        verify(contactRepo).findById(contactId);
        verify(contactRepo).save(existingContact);  // Saved with user set to null
        verify(contactRepo).delete(existingContact);  // Deleted from repo
    }

    @Test
    public void testDeleteContact_ContactDoesNotExist() {
        String contactId = "contact123";
        Mockito.when(contactRepo.findById(contactId)).thenReturn(Optional.empty());

        Contact deletedContact = contactService.deleteContact(contactId);

        assertNull(deletedContact);  // No contact should be returned
        verify(contactRepo).findById(contactId);
        verify(contactRepo, never()).save(any(Contact.class));  // save should not be called
        verify(contactRepo, never()).delete(any(Contact.class));  // delete should not be called
    }
}

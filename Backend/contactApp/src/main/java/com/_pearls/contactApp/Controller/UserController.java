package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Dto.ChangePasswordDto;
import com._pearls.contactApp.Dto.LoginDto;
import com._pearls.contactApp.Dto.SignupDto;
import com._pearls.contactApp.ExceptionHandling.ResourceNotFoundException;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getUsers() {
        List<User> users = userService.getUsers();
        if (users == null || users.isEmpty()) {
            throw new ResourceNotFoundException("No Users Found.");
        }
        return users;
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        if (user == null || user.getFirstName() == null || user.getLastName() == null || user.getEmail() == null || user.getPassword() == null || user.getPhone() == null || user.getAddress() == null) {
            throw new ResourceNotFoundException("User creation failed. Ensure none of the field is null.");
        } else if (user.getFirstName().isEmpty() || user.getLastName().isEmpty() || user.getEmail().isEmpty() || user.getPhone().isEmpty() || user.getAddress().isEmpty()) {
            throw new ResourceNotFoundException("User creation failed. Ensure none of the field is empty.");
        }
        return userService.createUser(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable String id, @RequestBody User user) {
        if (id == null || id.isEmpty()) {
            throw new ResourceNotFoundException("User ID is missing.");
        } else if (!userService.getCurrentUser(id).isPresent()) {
            throw new ResourceNotFoundException("User not Found.");
        } else if (user == null || user.getFirstName() == null || user.getLastName() == null || user.getEmail() == null || user.getPassword() == null || user.getPhone() == null || user.getAddress() == null) {
            throw new ResourceNotFoundException("User updation failed. Ensure none of the field is null.");
        } else if (user.getFirstName().isEmpty() || user.getLastName().isEmpty() || user.getEmail().isEmpty() || user.getPhone().isEmpty() || user.getAddress().isEmpty()) {
            throw new ResourceNotFoundException("User updation failed. Ensure none of the field is empty.");
        }
        return userService.updateUser(user, id);
    }

    @PostMapping("/login")
    public SignupDto checkEmailPassword(@RequestBody LoginDto loginDto) throws Exception {
        if (loginDto == null || loginDto.getEmail() == null || loginDto.getPassword() == null) {
            throw new ResourceNotFoundException("User login failed. Ensure none of the field is null.");
        } else if (loginDto.getEmail().isEmpty() || loginDto.getPassword().isEmpty()) {
            throw new ResourceNotFoundException("User login failed. Ensure none of the field is empty.");
        }
        return userService.checkEmailPassword(loginDto);
    }

    @PutMapping("/changePassword/{id}")
    public ChangePasswordDto changePassword(@PathVariable String id, @RequestBody ChangePasswordDto changePasswordDto) {
        if (id == null || id.isEmpty()) {
            throw new ResourceNotFoundException("User ID is missing.");
        } else if (!userService.getCurrentUser(id).isPresent()) {
            throw new ResourceNotFoundException("User not Found.");
        } else if (changePasswordDto == null || changePasswordDto.getCurrentPassword() == null || changePasswordDto.getNewPassword() == null) {
            throw new ResourceNotFoundException("User Password updation failed. Ensure none of the field is null.");
        } else if (changePasswordDto.getCurrentPassword().isEmpty() || changePasswordDto.getNewPassword().isEmpty()) {
            throw new ResourceNotFoundException("User Password updation failed. Ensure none of the field is empty.");
        }
        return userService.changePassword(id, changePasswordDto);
    }

}

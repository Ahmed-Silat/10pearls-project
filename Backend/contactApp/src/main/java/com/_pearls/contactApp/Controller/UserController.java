package com._pearls.contactApp.Controller;

import com._pearls.contactApp.Dto.LoginDto;
import com._pearls.contactApp.Dto.SignupDto;
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
        return this.userService.getUsers();
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return this.userService.createUser(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable String id, @RequestBody User user) {
        return userService.updateUser(user, id);
    }

    @PostMapping("/login")
    public SignupDto checkEmailPassword(@RequestBody LoginDto loginDto) throws Exception {
        return userService.checkEmailPassword(loginDto);
    }

}

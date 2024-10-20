package com._pearls.contactApp.Controller;

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
    public String createUser(@RequestBody User user) {
        return this.userService.createUser(user);
    }

    @PutMapping("/{id}")
    public String updateUser(@PathVariable String id, @RequestBody User user) {
        return userService.updateUser(user, id);
    }

}

package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.LoginDto;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@Transactional(rollbackOn = Exception.class)
@RequiredArgsConstructor
public class UserService {

    @Autowired
    private UserRepo userRepo;

    public List<User> getUsers() {
        return userRepo.findAll();
    }

    public String createUser(User user) {
        userRepo.save(user);
        return "New User Created...";
    }

    public String updateUser(User user, String id) {
        User updatedUser = userRepo.findById(id).get();
        updatedUser.setFirstName(user.getFirstName());
        updatedUser.setLastName(user.getLastName());
        updatedUser.setEmail(user.getEmail());
        updatedUser.setPassword(user.getPassword());
        updatedUser.setAddress(user.getAddress());
        updatedUser.setPhone(user.getPhone());
        userRepo.save(updatedUser);
        return "User updated with id: " + id;
    }

    public String checkEmailPassword(LoginDto loginDto) {
        Optional<User> existingUser = userRepo.findByEmail(loginDto.getEmail());

        if (existingUser.isEmpty()) {
            return "User does not exist";
        }

        User currentUser = existingUser.get();

        if (!currentUser.getPassword().equals(loginDto.getPassword())) {
            return "password is not correct";
        }

        return "User loggedin";
    }
}

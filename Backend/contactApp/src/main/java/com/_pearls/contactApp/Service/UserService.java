package com._pearls.contactApp.Service;

import com._pearls.contactApp.Dto.ChangePasswordDto;
import com._pearls.contactApp.Dto.LoginDto;
import com._pearls.contactApp.Dto.SignupDto;
import com._pearls.contactApp.Model.User;
import com._pearls.contactApp.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    private final PasswordEncoder passwordEncoder;

    public List<User> getUsers() {
        return userRepo.findAll();
    }

    public Optional<User> getCurrentUser(String id) {
        return userRepo.findById(id);
    }

    public ChangePasswordDto changePassword(String id, ChangePasswordDto changePasswordDto) {
        User user = userRepo.findById(id).get();

        if (passwordEncoder.matches(changePasswordDto.getCurrentPassword(), user.getPassword())) {
            user.setPassword(passwordEncoder.encode(changePasswordDto.getNewPassword()));
            return changePasswordDto;
        }
        return null;
    }

    public User createUser(User user) {
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);
        userRepo.save(user);
        return user;
    }

    public User updateUser(User user, String id) {
        User updatedUser = userRepo.findById(id).get();
        updatedUser.setFirstName(user.getFirstName());
        updatedUser.setLastName(user.getLastName());
        updatedUser.setEmail(user.getEmail());
//        updatedUser.setPassword(user.getPassword());
        updatedUser.setAddress(user.getAddress());
        updatedUser.setPhone(user.getPhone());

        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            updatedUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        return userRepo.save(updatedUser);
    }

    public SignupDto checkEmailPassword(LoginDto loginDto) throws Exception {
        Optional<User> existingUser = userRepo.findByEmail(loginDto.getEmail());

        if (existingUser.isEmpty()) {
            throw new Exception("User Does not exist");
        }

        User currentUser = existingUser.get();

        if (!passwordEncoder.matches(loginDto.getPassword(), currentUser.getPassword())) {
            throw new Exception("Password is not correct");
        }

        SignupDto signUpDto = new SignupDto();
        signUpDto.setId(currentUser.getId());
        signUpDto.setFirstName(currentUser.getFirstName());
        signUpDto.setLastName(currentUser.getLastName());
        signUpDto.setEmail(currentUser.getEmail());
        signUpDto.setPhone(currentUser.getPhone());
        signUpDto.setAddress(currentUser.getAddress());

        return signUpDto;
    }
}

package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User, String> {
    Optional<User> findById(String id);

    Optional<User> findByEmail(String email);
}

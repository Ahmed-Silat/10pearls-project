package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetOtpRepo extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findByUser_Id(Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM PasswordResetOtp p WHERE p.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}

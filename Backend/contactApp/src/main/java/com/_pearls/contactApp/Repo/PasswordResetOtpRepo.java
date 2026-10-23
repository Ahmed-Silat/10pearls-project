package com._pearls.contactApp.Repo;

import com._pearls.contactApp.Model.PasswordResetOtp;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetOtpRepo extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findByUser_Id(Long userId);

    /**
     * Loads the request and locks its row (SELECT ... FOR UPDATE) until the transaction ends. Parallel code
     * checks for the same user then run one at a time, so each sees the attempt count the previous one saved.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PasswordResetOtp p WHERE p.user.id = :userId")
    Optional<PasswordResetOtp> findByUserIdForUpdate(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM PasswordResetOtp p WHERE p.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}

package com.matchme.backend.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.matchme.backend.models.UserProfile;

import jakarta.transaction.Transactional;


public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    @Query("SELECT p FROM UserProfile p WHERE p.user.id <> :currentUserId")
    List<UserProfile> findRecommendationsForUser(@Param("currentUserId") Long currentUserId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE UserProfile up SET up.lastSeenAt = :lastSeenAt WHERE up.user.id = :userId")
    void updateLastSeenTime(@Param("userId") Long userId, @Param("lastSeenAt") LocalDateTime lastSeenAt);
}
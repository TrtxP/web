package com.matchme.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.matchme.backend.models.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    @Query("SELECT p FROM UserProfile p WHERE p.user.id <> :currentUserId")
    List<UserProfile> findRecommendationsForUser(@Param("currentUserId") Long currentUserId);
}
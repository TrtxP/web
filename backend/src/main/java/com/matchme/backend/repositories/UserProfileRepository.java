package com.matchme.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.matchme.backend.models.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

}
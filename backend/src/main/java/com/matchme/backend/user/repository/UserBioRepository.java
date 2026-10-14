package com.matchme.backend.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.matchme.backend.user.model.UserBio;

public interface UserBioRepository extends JpaRepository<UserBio, Long> {

}


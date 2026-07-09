package com.matchme.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.matchme.backend.models.UserBio;

public interface UserBioRepository extends JpaRepository<UserBio, Long> {

}

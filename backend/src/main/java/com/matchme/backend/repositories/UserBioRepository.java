package com.matchme.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.matchme.backend.models.UserBio;

@Repository
public interface UserBioRepository extends JpaRepository<UserBio, Long> {

}

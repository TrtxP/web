package com.matchme.backend.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.models.*;
import com.matchme.backend.repositories.*;


@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserBioRepository userBioRepository;

    public UserService(UserRepository userRepository, UserProfileRepository 
        userProfileRepository, UserBioRepository userBioRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userBioRepository = userBioRepository;
    }

    public User getBaseInfo(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public UserProfile getProfileInfo(Long id) {
        return userProfileRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public UserBio getBioInfo(Long id) {
        return userBioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}

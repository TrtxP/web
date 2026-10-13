package com.matchme.backend.services;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.dto.UserResponseDTO;
import com.matchme.backend.models.*;
import com.matchme.backend.repositories.*;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, 
            UserProfileRepository userProfileRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User getBaseInfo(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public UserResponseDTO getUserResponse(Long id) {
        User user = getBaseInfo(id);
        UserResponseDTO userResponseDTO = new UserResponseDTO();
        userResponseDTO.setId(user.getId());
        userResponseDTO.setName(user.getName());
        userResponseDTO.setProfilePictureUrl(user.getProfilePictureUrl());

        boolean online = false;
        if (user.getUserProfile() != null && user.getUserProfile().getIsOnline() != null) {
            online = user.getUserProfile().getIsOnline();
        } else {
            online = userProfileRepository.findById(id)
                    .map(up -> Boolean.TRUE.equals(up.getIsOnline()))
                    .orElse(false);
        }
        userResponseDTO.setIsOnline(online);
        return userResponseDTO;
    }

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is already existed by this email");
        }

        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);

        User savedUser = userRepository.save(user);
        return savedUser;
    }

    public User updateUserFull(Long id, User newUser) {
        Optional<User> optionalUser = userRepository.findById(id);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        User existingUser = optionalUser.get();

        existingUser.setEmail(newUser.getEmail());
        existingUser.setPassword(newUser.getPassword());
        existingUser.setName(newUser.getName());
        existingUser.setProfilePictureUrl(newUser.getProfilePictureUrl());

        return userRepository.save(existingUser);
    }

    public User updateUserPartial(Long id, User updatedFields) {
        Optional<User> optionalUser = userRepository.findById(id);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        User existingUser = optionalUser.get();

        if (updatedFields.getEmail() != null) {
            existingUser.setEmail(updatedFields.getEmail());
        }

        if (updatedFields.getPassword() != null) {
            existingUser.setPassword(updatedFields.getPassword());
        }

        if (updatedFields.getName() != null) {
            existingUser.setName(updatedFields.getName());
        }

        if (updatedFields.getProfilePictureUrl() != null) {
            existingUser.setProfilePictureUrl(updatedFields.getProfilePictureUrl());
        }

        return userRepository.save(existingUser);
    }

    public void deleteUser(Long id) {
        if (userRepository.findById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        userRepository.deleteById(id);
    }
}

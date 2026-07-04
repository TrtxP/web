package com.matchme.backend.services;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.models.*;
import com.matchme.backend.repositories.*;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User getBaseInfo(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
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

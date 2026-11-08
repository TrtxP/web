package com.matchme.backend.user.service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.user.dto.UserResponseDTO;
import com.matchme.backend.user.mapper.UserMapper;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.repository.UserProfileRepository;
import com.matchme.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public User getBaseInfo(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getUserResponse(Long id) {
        User user = getBaseInfo(id);

        boolean online = false;
        if (user.getUserProfile() != null && user.getUserProfile().getIsOnline() != null) {
            online = user.getUserProfile().getIsOnline();
        } else {
            online = userProfileRepository.findById(id)
                    .map(up -> Boolean.TRUE.equals(up.getIsOnline()))
                    .orElse(false);
        }

        return userMapper.toUserResponseDTO(user, online);
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is already existed by this email");
        }

        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);

        return userRepository.save(user);
    }

    @Transactional
    @PreAuthorize("#id == authentication.principal")
    public User updateUserFull(Long id, User newUser) {
        Optional<User> optionalUser = userRepository.findById(id);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        User existingUser = optionalUser.get();

        existingUser.setEmail(newUser.getEmail());
        existingUser.setPassword(encodePassword(newUser.getPassword()));
        existingUser.setName(newUser.getName());
        existingUser.setProfilePictureUrl(newUser.getProfilePictureUrl());

        return userRepository.save(existingUser);
    }

    @Transactional
    @PreAuthorize("#id == authentication.principal")
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
            existingUser.setPassword(encodePassword(updatedFields.getPassword()));
        }

        if (updatedFields.getName() != null) {
            existingUser.setName(updatedFields.getName());
        }

        if (updatedFields.getProfilePictureUrl() != null) {
            existingUser.setProfilePictureUrl(updatedFields.getProfilePictureUrl());
        }

        return userRepository.save(existingUser);
    }

    @Transactional
    @PreAuthorize("#id == authentication.principal")
    public void deleteUser(Long id) {
        if (userRepository.findById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        userRepository.deleteById(id);
    }

    private String encodePassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 64
                || !password.matches("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_]).*$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must contain 8 to 64 characters, upper and lower case letters, a digit and a special character");
        }
        return passwordEncoder.encode(password);
    }
}


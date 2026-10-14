package com.matchme.backend.user.service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Transactional
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

    @Transactional
    public void deleteUser(Long id) {
        if (userRepository.findById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        userRepository.deleteById(id);
    }
}


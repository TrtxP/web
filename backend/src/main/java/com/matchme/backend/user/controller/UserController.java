package com.matchme.backend.user.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.user.dto.UserResponseDTO;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserBaseInfo(@PathVariable Long id) {
        UserResponseDTO userResponseDTO = userService.getUserResponse(id);
        return ResponseEntity.ok(userResponseDTO);
    }

    @PostMapping
    public ResponseEntity<User> registerUser(@Valid @RequestBody User user) {
        User savedUser = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUserFull(@PathVariable Long id, @RequestBody User newUser) {
        User existingUser = userService.updateUserFull(id, newUser);
        return ResponseEntity.status(HttpStatus.OK).body(existingUser);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<User> updateUserPartial(@PathVariable Long id, @RequestBody User updatedField) {
        User existingUser = userService.updateUserPartial(id, updatedField);
        return ResponseEntity.status(HttpStatus.OK).body(existingUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}


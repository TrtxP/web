package com.matchme.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.dto.UserResponseDTO;
import com.matchme.backend.models.User;
import com.matchme.backend.services.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) 
    {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserBaseInfo(@PathVariable Long id) {
        UserResponseDTO userResponseDTO = userService.getUserResponse(id);
        return ResponseEntity.ok(userResponseDTO);
    }

    @PostMapping
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        User savedUser = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserFull(@PathVariable Long id, @RequestBody User newUser) {
        User existingUser = userService.updateUserFull(id, newUser);
        return ResponseEntity.status(HttpStatus.OK).body(existingUser);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateUserPartial(@PathVariable Long id, @RequestBody User updatedField) {
        User existingUser = userService.updateUserPartial(id, updatedField);
        return ResponseEntity.status(HttpStatus.OK).body(existingUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

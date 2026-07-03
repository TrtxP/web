package com.matchme.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.models.User;
import com.matchme.backend.repositories.UserRepository;
import com.matchme.backend.services.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/users")
public class UserController {
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserService userService, UserRepository userRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserBaseInfo(@RequestParam Long id) {
        return ResponseEntity.ok(userService.getBaseInfo(id));
    }
    
    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getUserProfile(@RequestParam Long id) {
        return ResponseEntity.ok(userService.getProfileInfo(id));
    }

    @GetMapping("/bio/{id}")
    public ResponseEntity<?> getUserBio(@RequestParam Long id) {
        return ResponseEntity.ok(userService.getBioInfo(id));
    }

    @PostMapping
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User is already existed by this email");
        }

        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);

        User savedUser = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }
}

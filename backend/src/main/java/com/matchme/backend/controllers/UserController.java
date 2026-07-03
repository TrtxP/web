package com.matchme.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.services.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
}

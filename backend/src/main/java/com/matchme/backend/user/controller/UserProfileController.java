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

import com.matchme.backend.user.dto.UserProfileResponseDTO;
import com.matchme.backend.user.model.UserProfile;
import com.matchme.backend.user.service.UserProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileResponseDTO> getUserProfile(@PathVariable Long id) {
        UserProfileResponseDTO userProfileResponseDTO = userProfileService.getProfileResponseDTO(id);
        return ResponseEntity.ok(userProfileResponseDTO);
    }

    @PostMapping("/{id}/profile")
    public ResponseEntity<UserProfile> createUserProfile(@PathVariable Long id, @Valid @RequestBody UserProfile userProfile) {
        UserProfile savedUserProfile = userProfileService.createUserProfile(id, userProfile);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUserProfile);
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<UserProfile> updateUserProfileFull(@PathVariable Long id, @RequestBody UserProfile newUserProfile) {
        UserProfile existingUserProfile = userProfileService.updateProfileFull(id, newUserProfile);
        return ResponseEntity.ok(existingUserProfile);
    }

    @PatchMapping("/{id}/profile")
    public ResponseEntity<UserProfile> updateUserProfilePartial(@PathVariable Long id,
            @RequestBody UserProfile updatUserProfile) {
        UserProfile existingUserProfile = userProfileService.updateProfilePartial(id, updatUserProfile);
        return ResponseEntity.ok(existingUserProfile);
    }

    @DeleteMapping("/{id}/profile")
    public ResponseEntity<Void> deleteUserProfile(@PathVariable Long id) {
        userProfileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}


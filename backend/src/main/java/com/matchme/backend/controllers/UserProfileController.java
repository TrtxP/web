package com.matchme.backend.controllers;

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

import com.matchme.backend.dto.UserProfileResponseDTO;
import com.matchme.backend.models.UserProfile;
import com.matchme.backend.services.UserProfileService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
public class UserProfileController {
    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        UserProfile userProfile = userProfileService.getProfileInfo(id);
        UserProfileResponseDTO userProfileResponseDTO = new UserProfileResponseDTO();
        userProfileResponseDTO.setAboutMe(userProfile.getAboutMe());
        userProfileResponseDTO.setCity(userProfile.getCity());
        userProfileResponseDTO.setAge(userProfile.getAge());
        userProfileResponseDTO.setGender(userProfile.getGender());
        userProfileResponseDTO.setLatitude(userProfile.getLatitude());
        userProfileResponseDTO.setLongitude(userProfile.getLongitude());
        userProfileResponseDTO.setPreferredDistance(userProfile.getPreferredDistance());
        userProfileResponseDTO.setRecommendByCityOnly(userProfile.getRecommendByCityOnly());
        userProfileResponseDTO.setLastSeenAt(userProfile.getLastSeenAt());
        return ResponseEntity.status(HttpStatus.OK).body(userProfileResponseDTO);
    }

    @PostMapping("/{id}/profile")
    public ResponseEntity<?> createUserProfile(@PathVariable Long id, @Valid @RequestBody UserProfile userProfile) {
        UserProfile savedUserProfile = userProfileService.createUserProfile(id, userProfile);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUserProfile);
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateUserProfileFull(@PathVariable Long id, @RequestBody UserProfile newUserProfile) {
        UserProfile existingUserProfile = userProfileService.updateProfileFull(id, newUserProfile);
        return ResponseEntity.status(HttpStatus.OK).body(existingUserProfile);
    }

    @PatchMapping("/{id}/profile")
    public ResponseEntity<?> updateUserProfilePartial(@PathVariable Long id,
            @RequestBody UserProfile updatUserProfile) {
        UserProfile existingUserProfile = userProfileService.updateProfilePartial(id, updatUserProfile);
        return ResponseEntity.status(HttpStatus.OK).body(existingUserProfile);
    }

    @DeleteMapping("/{id}/profile")
    public ResponseEntity<?> deleteUserProfile(@PathVariable Long id) {
        userProfileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}

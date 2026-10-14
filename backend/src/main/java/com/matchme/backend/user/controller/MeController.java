package com.matchme.backend.user.controller;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.matchme.backend.shared.security.CurrentUserProvider;
import com.matchme.backend.shared.storage.FileStorageService;
import com.matchme.backend.user.dto.MyPrivateProfileResponseDTO;
import com.matchme.backend.user.dto.UserBioPatchDTO;
import com.matchme.backend.user.dto.UserBioResponseDTO;
import com.matchme.backend.user.dto.UserProfileResponseDTO;
import com.matchme.backend.user.mapper.UserMapper;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.model.UserBio;
import com.matchme.backend.user.model.UserProfile;
import com.matchme.backend.user.service.UserBioService;
import com.matchme.backend.user.service.UserProfileService;
import com.matchme.backend.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * /me, /me/profile, /me/bio — точні аналоги
 * UserController/UserProfileController/UserBioController, але без {id} в URL:
 * id підставляється автоматично з JWT поточного користувача (через CurrentUserProvider).
 */
@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class MeController {

    private final UserService userService;
    private final UserProfileService userProfileService;
    private final UserBioService userBioService;
    private final FileStorageService fileStorageService;
    private final CurrentUserProvider currentUserProvider;
    private final UserMapper userMapper;

    // ==================== /me ====================

    @GetMapping
    public ResponseEntity<MyPrivateProfileResponseDTO> getMe() {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = userService.getBaseInfo(userId);
        return ResponseEntity.ok(userMapper.toMyPrivateProfileResponseDTO(user));
    }

    @PutMapping
    public ResponseEntity<MyPrivateProfileResponseDTO> updateMeFull(@RequestBody User newUser) {
        Long userId = currentUserProvider.getCurrentUserId();
        User existingUser = userService.updateUserFull(userId, newUser);
        return ResponseEntity.ok(userMapper.toMyPrivateProfileResponseDTO(existingUser));
    }

    @PatchMapping
    public ResponseEntity<MyPrivateProfileResponseDTO> updateMePartial(@RequestBody User updatedFields) {
        Long userId = currentUserProvider.getCurrentUserId();
        User existingUser = userService.updateUserPartial(userId, updatedFields);
        return ResponseEntity.ok(userMapper.toMyPrivateProfileResponseDTO(existingUser));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteMe() {
        Long userId = currentUserProvider.getCurrentUserId();
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== /me/profile ====================

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponseDTO> getMyProfile() {
        Long userId = currentUserProvider.getCurrentUserId();
        UserProfile profile = userProfileService.getProfileInfo(userId);
        return ResponseEntity.ok(userMapper.toUserProfileResponseDTO(profile));
    }

    @PostMapping("/profile")
    public ResponseEntity<UserProfile> createMyProfile(@Valid @RequestBody UserProfile profile) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserProfile saved = userProfileService.createUserProfile(userId, profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfile> updateMyProfileFull(@RequestBody UserProfile newProfile) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserProfile existing = userProfileService.updateProfileFull(userId, newProfile);
        return ResponseEntity.ok(existing);
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserProfile> updateMyProfilePartial(@RequestBody UserProfile updatedFields) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserProfile existing = userProfileService.updateProfilePartial(userId, updatedFields);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteMyProfile() {
        Long userId = currentUserProvider.getCurrentUserId();
        userProfileService.deleteProfile(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<Map<String, String>> uploadProfilePicture(
            @RequestParam("file") MultipartFile file) throws IOException {
        Long userId = currentUserProvider.getCurrentUserId();
        String pictureUrl = fileStorageService.uploadUserAvatar(userId, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Collections.singletonMap("profilePictureUrl", pictureUrl));
    }

    @DeleteMapping("/profile-picture")
    public ResponseEntity<Void> deleteProfilePicture() throws IOException {
        Long userId = currentUserProvider.getCurrentUserId();
        fileStorageService.deleteUserAvatar(userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== /me/bio ====================

    @GetMapping("/bio")
    public ResponseEntity<UserBioResponseDTO> getMyBio() {
        Long userId = currentUserProvider.getCurrentUserId();
        UserBio bio = userBioService.getBioInfo(userId);
        return ResponseEntity.ok(userMapper.toUserBioResponseDTO(bio));
    }

    @PostMapping("/bio")
    public ResponseEntity<UserBio> createMyBio(@Valid @RequestBody UserBio bio) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserBio saved = userBioService.createUserBio(userId, bio);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/bio")
    public ResponseEntity<UserBio> updateMyBioFull(@RequestBody UserBio newBio) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserBio existing = userBioService.updateBioFull(userId, newBio);
        return ResponseEntity.ok(existing);
    }

    @PatchMapping("/bio")
    public ResponseEntity<UserBio> updateMyBioPartial(@RequestBody UserBioPatchDTO updatedFields) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserBio existing = userBioService.updateBioPartial(userId, updatedFields);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/bio")
    public ResponseEntity<Void> deleteMyBio() {
        Long userId = currentUserProvider.getCurrentUserId();
        userBioService.deleteBio(userId);
        return ResponseEntity.noContent().build();
    }
}


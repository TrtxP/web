package com.matchme.backend.controllers;

import java.io.IOException;
import java.util.Collections;

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

import com.matchme.backend.config.CurrentUserProvider;
import com.matchme.backend.dto.MyPrivateProfileResponseDTO;
import com.matchme.backend.dto.UserBioPatchDTO;
import com.matchme.backend.dto.UserBioResponseDTO;
import com.matchme.backend.dto.UserProfileResponseDTO;
import com.matchme.backend.services.FileStorageService;
import com.matchme.backend.models.User;
import com.matchme.backend.models.UserBio;
import com.matchme.backend.models.UserProfile;
import com.matchme.backend.services.UserBioService;
import com.matchme.backend.services.UserProfileService;
import com.matchme.backend.services.UserService;

import jakarta.validation.Valid;

/**
 * /me, /me/profile, /me/bio — точні аналоги
 * UserController/UserProfileController/
 * UserBioController, але без {id} в URL: id підставляється автоматично з JWT
 * поточного користувача (через CurrentUserProvider), а не з довільного шляху.
 * Це саме те, що вимагає ТЗ: "/me — shortcut до /users/{id} для
 * автентифікованого користувача", так само для /me/profile і /me/bio.
 */
@RestController
@RequestMapping("/me")
public class MeController {

    private final UserService userService;
    private final UserProfileService userProfileService;
    private final UserBioService userBioService;
    private final FileStorageService fileStorageService;
    private final CurrentUserProvider currentUserProvider;

    public MeController(UserService userService,
            UserProfileService userProfileService,
            UserBioService userBioService,
            FileStorageService fileStorageService,
            CurrentUserProvider currentUserProvider) {
        this.userService = userService;
        this.userProfileService = userProfileService;
        this.userBioService = userBioService;
        this.fileStorageService = fileStorageService;
        this.currentUserProvider = currentUserProvider;
    }

    // ==================== /me ====================

    @GetMapping
    public ResponseEntity<?> getMe() {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = userService.getBaseInfo(userId);

        MyPrivateProfileResponseDTO dto = new MyPrivateProfileResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    public ResponseEntity<?> updateMeFull(@RequestBody User newUser) {
        Long userId = currentUserProvider.getCurrentUserId();
        User existingUser = userService.updateUserFull(userId, newUser);
        MyPrivateProfileResponseDTO dto = new MyPrivateProfileResponseDTO();
        dto.setId(existingUser.getId());
        dto.setName(existingUser.getName());
        dto.setEmail(existingUser.getEmail());
        dto.setProfilePictureUrl(existingUser.getProfilePictureUrl());
        return ResponseEntity.status(HttpStatus.OK).body(existingUser);
    }

    @PatchMapping
    public ResponseEntity<?> updateMePartial(@RequestBody User updatedFields) {
        Long userId = currentUserProvider.getCurrentUserId();
        User existingUser = userService.updateUserPartial(userId, updatedFields);
        MyPrivateProfileResponseDTO dto = new MyPrivateProfileResponseDTO();
        dto.setId(existingUser.getId());
        dto.setName(existingUser.getName());
        dto.setEmail(existingUser.getEmail());
        dto.setProfilePictureUrl(existingUser.getProfilePictureUrl());
        return ResponseEntity.status(HttpStatus.OK).body(existingUser);
    }

    @DeleteMapping
    public ResponseEntity<?> deleteMe() {
        Long userId = currentUserProvider.getCurrentUserId();
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== /me/profile ====================

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile() {
        Long userId = currentUserProvider.getCurrentUserId();
        UserProfile profile = userProfileService.getProfileInfo(userId);

        UserProfileResponseDTO dto = new UserProfileResponseDTO();
        dto.setAboutMe(profile.getAboutMe());
        dto.setCity(profile.getCity());
        dto.setAge(profile.getAge());
        dto.setGender(profile.getGender());
        dto.setLatitude(profile.getLatitude());
        dto.setLongitude(profile.getLongitude());
        dto.setPreferredDistance(profile.getPreferredDistance());
        dto.setRecommendByCityOnly(profile.getRecommendByCityOnly());
        dto.setIsOnline(profile.getIsOnline());
        dto.setLastSeenAt(profile.getLastSeenAt());
        return ResponseEntity.status(HttpStatus.OK).body(dto);
    }

    @PostMapping("/profile")
    public ResponseEntity<?> createMyProfile(@Valid @RequestBody UserProfile profile) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserProfile saved = userProfileService.createUserProfile(userId, profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateMyProfileFull(@RequestBody UserProfile newProfile) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserProfile existing = userProfileService.updateProfileFull(userId, newProfile);
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @PatchMapping("/profile")
    public ResponseEntity<?> updateMyProfilePartial(@RequestBody UserProfile updatedFields) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserProfile existing = userProfileService.updateProfilePartial(userId, updatedFields);
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @DeleteMapping("/profile")
    public ResponseEntity<?> deleteMyProfile() {
        Long userId = currentUserProvider.getCurrentUserId();
        userProfileService.deleteProfile(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(
            @RequestParam("file") MultipartFile file) throws IOException {
        Long userId = currentUserProvider.getCurrentUserId();
        String pictureUrl = fileStorageService.uploadUserAvatar(userId, file);

        // Повертаємо JSON: {"profilePictureUrl": "/uploads/profiles/..."}
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Collections.singletonMap("profilePictureUrl", pictureUrl));
    }

    @DeleteMapping("/profile-picture")
    public ResponseEntity<?> deleteProfilePicture() throws IOException {
        Long userId = currentUserProvider.getCurrentUserId();
        fileStorageService.deleteUserAvatar(userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== /me/bio ====================

    @GetMapping("/bio")
    public ResponseEntity<?> getMyBio() {
        Long userId = currentUserProvider.getCurrentUserId();
        UserBio bio = userBioService.getBioInfo(userId);

        UserBioResponseDTO dto = new UserBioResponseDTO();
        dto.setId(bio.getUserId());
        dto.setInterests(bio.getInterests());
        dto.setFavoriteFood(bio.getFavoriteFood());
        dto.setFavoriteMusic(bio.getFavoriteMusic());
        dto.setLikesLongWalks(bio.isLikesLongWalks());
        dto.setLookingFor(bio.getLookingFor());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/bio")
    public ResponseEntity<?> createMyBio(@Valid @RequestBody UserBio bio) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserBio saved = userBioService.createUserBio(userId, bio);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/bio")
    public ResponseEntity<?> updateMyBioFull(@RequestBody UserBio newBio) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserBio existing = userBioService.updateBioFull(userId, newBio);
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @PatchMapping("/bio")
    public ResponseEntity<?> updateMyBioPartial(@RequestBody UserBioPatchDTO updatedFields) {
        Long userId = currentUserProvider.getCurrentUserId();
        UserBio existing = userBioService.updateBioPartial(userId, updatedFields);
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @DeleteMapping("/bio")
    public ResponseEntity<?> deleteMyBio() {
        Long userId = currentUserProvider.getCurrentUserId();
        userBioService.deleteBio(userId);
        return ResponseEntity.noContent().build();
    }
}

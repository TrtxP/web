package com.matchme.backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.config.CurrentUserProvider;
import com.matchme.backend.dto.UserBioPatchDTO;
import com.matchme.backend.dto.UserBioResponseDTO;
import com.matchme.backend.dto.UserProfileResponseDTO;
import com.matchme.backend.dto.UserResponseDTO;
import com.matchme.backend.models.User;
import com.matchme.backend.models.UserBio;
import com.matchme.backend.models.UserProfile;
import com.matchme.backend.services.UserBioService;
import com.matchme.backend.services.UserProfileService;
import com.matchme.backend.services.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * /me, /me/profile, /me/bio — точні аналоги UserController/UserProfileController/
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
    private final CurrentUserProvider currentUserProvider;

    public MeController(UserService userService,
                         UserProfileService userProfileService,
                         UserBioService userBioService,
                         CurrentUserProvider currentUserProvider) {
        this.userService = userService;
        this.userProfileService = userProfileService;
        this.userBioService = userBioService;
        this.currentUserProvider = currentUserProvider;
    }

    // ==================== /me ====================

    @GetMapping
    public ResponseEntity<?> getMe(HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        User user = userService.getBaseInfo(userId);

        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    public ResponseEntity<?> updateMeFull(@RequestBody User newUser, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        User existingUser = userService.updateUserFull(userId, newUser);
        return ResponseEntity.status(HttpStatus.OK).body(existingUser);
    }

    @PatchMapping
    public ResponseEntity<?> updateMePartial(@RequestBody User updatedFields, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        User existingUser = userService.updateUserPartial(userId, updatedFields);
        return ResponseEntity.status(HttpStatus.OK).body(existingUser);
    }

    @DeleteMapping
    public ResponseEntity<?> deleteMe(HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== /me/profile ====================

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        UserProfile profile = userProfileService.getProfileInfo(userId);

        UserProfileResponseDTO dto = new UserProfileResponseDTO();
        dto.setAboutMe(profile.getAboutMe());
        return ResponseEntity.status(HttpStatus.OK).body(dto);
    }

    @PostMapping("/profile")
    public ResponseEntity<?> createMyProfile(@Valid @RequestBody UserProfile profile, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        UserProfile saved = userProfileService.createUserProfile(userId, profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateMyProfileFull(@RequestBody UserProfile newProfile, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        UserProfile existing = userProfileService.updateProfileFull(userId, newProfile);
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @PatchMapping("/profile")
    public ResponseEntity<?> updateMyProfilePartial(@RequestBody UserProfile updatedFields, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        UserProfile existing = userProfileService.updateProfilePartial(userId, updatedFields);
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @DeleteMapping("/profile")
    public ResponseEntity<?> deleteMyProfile(HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        userProfileService.deleteProfile(userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== /me/bio ====================

    @GetMapping("/bio")
    public ResponseEntity<?> getMyBio(HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
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
    public ResponseEntity<?> createMyBio(@Valid @RequestBody UserBio bio, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        UserBio saved = userBioService.createUserBio(userId, bio);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/bio")
    public ResponseEntity<?> updateMyBioFull(@RequestBody UserBio newBio, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        UserBio existing = userBioService.updateBioFull(userId, newBio);
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @PatchMapping("/bio")
    public ResponseEntity<?> updateMyBioPartial(@RequestBody UserBioPatchDTO updatedFields, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        UserBio existing = userBioService.updateBioPartial(userId, updatedFields);
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @DeleteMapping("/bio")
    public ResponseEntity<?> deleteMyBio(HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId(request);
        userBioService.deleteBio(userId);
        return ResponseEntity.noContent().build();
    }
}

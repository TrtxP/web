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

import com.matchme.backend.dto.UserBioPatchDTO;
import com.matchme.backend.dto.UserBioResponseDTO;
import com.matchme.backend.models.UserBio;
import com.matchme.backend.services.UserBioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
public class UserBioController {
    private final UserBioService userBioService;

    public UserBioController(UserBioService userBioService) {
        this.userBioService = userBioService;
    }

    @GetMapping("/{id}/bio")
    public ResponseEntity<?> getUserBio(@PathVariable Long id) {
        UserBio userBio = userBioService.getBioInfo(id);
        UserBioResponseDTO userBioResponseDTO = new UserBioResponseDTO();
        userBioResponseDTO.setId(userBio.getUserId());
        userBioResponseDTO.setInterests(userBio.getInterests());
        userBioResponseDTO.setFavoriteFood(userBio.getFavoriteFood());
        userBioResponseDTO.setFavoriteMusic(userBio.getFavoriteMusic());
        userBioResponseDTO.setLikesLongWalks(userBio.isLikesLongWalks());
        userBioResponseDTO.setLookingFor(userBio.getLookingFor());
        return ResponseEntity.ok(userBioResponseDTO);
    }

    @PostMapping("/{id}/bio")
    public ResponseEntity<?> createUserBio(@PathVariable Long id, @Valid @RequestBody UserBio userBio) {
        UserBio savedUserBio = userBioService.createUserBio(id, userBio);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUserBio);
    }

    @PutMapping("/{id}/bio")
    public ResponseEntity<?> updateUserBioFull(@PathVariable Long id, @RequestBody UserBio newUSerBio) {
        UserBio existingUserBio = userBioService.updateBioFull(id, newUSerBio);
        return ResponseEntity.status(HttpStatus.OK).body(existingUserBio);
    }

    @PatchMapping("/{id}/bio")
    public ResponseEntity<?> updateUserBioPartial(@PathVariable Long id, @RequestBody UserBioPatchDTO updatedFields) {
        UserBio existingUserBio = userBioService.updateBioPartial(id, updatedFields);
        return ResponseEntity.status(HttpStatus.OK).body(existingUserBio);
    }

    @DeleteMapping("/{id}/bio")
    public ResponseEntity<?> deleteUserBio(@PathVariable Long id) {
        userBioService.deleteBio(id);
        return ResponseEntity.noContent().build();
    }
}

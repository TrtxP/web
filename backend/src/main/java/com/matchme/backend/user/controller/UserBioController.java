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

import com.matchme.backend.user.dto.UserBioPatchDTO;
import com.matchme.backend.user.dto.UserBioResponseDTO;
import com.matchme.backend.user.mapper.UserMapper;
import com.matchme.backend.user.model.UserBio;
import com.matchme.backend.user.service.UserBioService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserBioController {

    private final UserBioService userBioService;
    private final UserMapper userMapper;

    @GetMapping("/{id}/bio")
    public ResponseEntity<UserBioResponseDTO> getUserBio(@PathVariable Long id) {
        UserBio userBio = userBioService.getBioInfo(id);
        return ResponseEntity.ok(userMapper.toUserBioResponseDTO(userBio));
    }

    @PostMapping("/{id}/bio")
    public ResponseEntity<UserBio> createUserBio(@PathVariable Long id, @Valid @RequestBody UserBio userBio) {
        UserBio savedUserBio = userBioService.createUserBio(id, userBio);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUserBio);
    }

    @PutMapping("/{id}/bio")
    public ResponseEntity<UserBio> updateUserBioFull(@PathVariable Long id, @RequestBody UserBio newUSerBio) {
        UserBio existingUserBio = userBioService.updateBioFull(id, newUSerBio);
        return ResponseEntity.ok(existingUserBio);
    }

    @PatchMapping("/{id}/bio")
    public ResponseEntity<UserBio> updateUserBioPartial(@PathVariable Long id, @RequestBody UserBioPatchDTO updatedFields) {
        UserBio existingUserBio = userBioService.updateBioPartial(id, updatedFields);
        return ResponseEntity.ok(existingUserBio);
    }

    @DeleteMapping("/{id}/bio")
    public ResponseEntity<Void> deleteUserBio(@PathVariable Long id) {
        userBioService.deleteBio(id);
        return ResponseEntity.noContent().build();
    }
}


package com.matchme.backend.recommendation.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.connection.service.ConnectionService;
import com.matchme.backend.recommendation.service.RecommendationService;
import com.matchme.backend.shared.dto.IdResponseDTO;
import com.matchme.backend.shared.security.CurrentUserProvider;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final ConnectionService connectionService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public ResponseEntity<?> getRecommendations() {
        Long userId = currentUserProvider.getCurrentUserId();

        if (!recommendationService.isProfileComplete(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Profile is incomplete. Please fill in your city, gender, age, and looking for criteria.");
        }

        List<IdResponseDTO> result = recommendationService.getRecommendations(userId).stream()
                .map(IdResponseDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{targetId}")
    public ResponseEntity<Void> dismissRecommendation(@PathVariable Long targetId) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.dismissRecommendation(userId, targetId);
        return ResponseEntity.noContent().build();
    }
}


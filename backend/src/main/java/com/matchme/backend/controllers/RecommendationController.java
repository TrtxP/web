package com.matchme.backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.config.CurrentUserProvider;
import com.matchme.backend.dto.IdResponseDTO;
import com.matchme.backend.models.User;
import com.matchme.backend.repositories.UserRepository;
import com.matchme.backend.services.ConnectionService;
import com.matchme.backend.services.RecommendationService;

@RestController
@RequestMapping("/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final ConnectionService connectionService;
    private final CurrentUserProvider currentUserProvider;
    private final UserRepository userRepository;

    public RecommendationController(RecommendationService recommendationService,
            ConnectionService connectionService,
            CurrentUserProvider currentUserProvider,
            UserRepository userRepository) {
        this.recommendationService = recommendationService;
        this.connectionService = connectionService;
        this.currentUserProvider = currentUserProvider;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getRecommendations() {
        Long userId = currentUserProvider.getCurrentUserId();

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!recommendationService.isProfileComplete(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Profile is incomplete. Please fill in your city, gender, age, and looking for criteria.");
        }

        List<IdResponseDTO> result = recommendationService.getRecommendations(userId).stream()
                .map(IdResponseDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{targetId}")
    public ResponseEntity<?> dismissRecommendation(@PathVariable Long targetId) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.dismissRecommendation(userId, targetId);
        return ResponseEntity.noContent().build();
    }
}

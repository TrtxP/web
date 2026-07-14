package com.matchme.backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.config.CurrentUserProvider;
import com.matchme.backend.dto.IdResponseDTO;
import com.matchme.backend.services.ConnectionService;
import com.matchme.backend.services.RecommendationService;

@RestController
@RequestMapping("/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final ConnectionService connectionService;
    private final CurrentUserProvider currentUserProvider;

    public RecommendationController(RecommendationService recommendationService,
            ConnectionService connectionService,
            CurrentUserProvider currentUserProvider) {
        this.recommendationService = recommendationService;
        this.connectionService = connectionService;
        this.currentUserProvider = currentUserProvider;
    }

    // Повертає лише id, максимум 10 — як вимагає специфікація
    @GetMapping
    public ResponseEntity<?> getRecommendations() {
        Long userId = currentUserProvider.getCurrentUserId();
        List<IdResponseDTO> result = recommendationService.getRecommendations(userId).stream()
                .map(IdResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // Проігнорувати (dismiss) рекомендацію — більше не показувати цього користувача
    @DeleteMapping("/{targetId}")
    public ResponseEntity<?> dismissRecommendation(@PathVariable Long targetId) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.dismissRecommendation(userId, targetId);
        return ResponseEntity.noContent().build();
    }
}

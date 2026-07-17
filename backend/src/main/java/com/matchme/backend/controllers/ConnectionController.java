package com.matchme.backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.config.CurrentUserProvider;
import com.matchme.backend.dto.ConnectionDTO;
import com.matchme.backend.dto.IdResponseDTO;
import com.matchme.backend.services.ConnectionService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/connections")
public class ConnectionController {

    private final ConnectionService connectionService;
    private final CurrentUserProvider currentUserProvider;

    public ConnectionController(ConnectionService connectionService, CurrentUserProvider currentUserProvider) {
        this.connectionService = connectionService;
        this.currentUserProvider = currentUserProvider;
    }

    // Повертає лише id підключених користувачів — як вимагає специфікація
    @GetMapping
    public ResponseEntity<?> getConnections(HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        List<IdResponseDTO> result = connectionService.getConnectionIds(userId).stream()
                .map(IdResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // Отримати конкретне з'єднання за ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getConnectionById(@PathVariable Long id) {
        Long userId = currentUserProvider.getCurrentUserId();

        // Тут має бути виклик сервісу, який дістає connection
        // і бажано перевіряє, чи належить він поточному userId
        var connection = connectionService.getConnectionById(id, userId);

        ConnectionDTO dto = new ConnectionDTO(
                connection.getId(),
                connection.getRequester().getId(),
                connection.getReceiver().getId(),
                connection.getStatus().name());

        return ResponseEntity.ok(dto);
    }

    // Вхідні запити на з'єднання, що очікують рішення
    @GetMapping("/requests")
    public ResponseEntity<?> getIncomingRequests(HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        List<IdResponseDTO> result = connectionService.getIncomingRequests(userId).stream()
                .map(c -> new IdResponseDTO(c.getId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // Надіслати запит на з'єднання
    @PostMapping("/{targetId}")
    public ResponseEntity<?> requestConnection(@PathVariable Long targetId, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.requestConnection(userId, targetId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // Прийняти або відхилити вхідний запит:
    // /connections/{connectionId}/respond?accept=true
    @PatchMapping("/{connectionId}/respond")
    public ResponseEntity<?> respondToRequest(@PathVariable Long connectionId,
            @RequestParam boolean accept,
            HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.respondToRequest(connectionId, userId, accept);
        return ResponseEntity.ok().build();
    }

    // Розірвати існуюче з'єднання
    @DeleteMapping("/{otherUserId}")
    public ResponseEntity<?> disconnect(@PathVariable Long otherUserId, HttpServletRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.disconnect(userId, otherUserId);
        return ResponseEntity.noContent().build();
    }
}

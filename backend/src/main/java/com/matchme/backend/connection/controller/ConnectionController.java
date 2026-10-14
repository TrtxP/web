package com.matchme.backend.connection.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.connection.dto.ConnectionDTO;
import com.matchme.backend.connection.model.Connection;
import com.matchme.backend.connection.service.ConnectionService;
import com.matchme.backend.shared.dto.IdResponseDTO;
import com.matchme.backend.shared.security.CurrentUserProvider;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;
    private final CurrentUserProvider currentUserProvider;

    // Повертає лише id підключених користувачів — як вимагає специфікація
    @GetMapping
    public ResponseEntity<List<IdResponseDTO>> getConnections() {
        Long userId = currentUserProvider.getCurrentUserId();
        List<IdResponseDTO> result = connectionService.getConnectionIds(userId).stream()
                .map(IdResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // Отримати конкретне з'єднання за ID
    @GetMapping("/{id}")
    public ResponseEntity<ConnectionDTO> getConnectionById(@PathVariable Long id) {
        Long userId = currentUserProvider.getCurrentUserId();

        Connection connection = connectionService.getConnectionById(id, userId);

        ConnectionDTO dto = new ConnectionDTO(
                connection.getId(),
                connection.getRequester().getId(),
                connection.getReceiver().getId(),
                connection.getStatus().name());

        return ResponseEntity.ok(dto);
    }

    // Вхідні запити на з'єднання, що очікують рішення
    @GetMapping("/requests")
    public ResponseEntity<List<IdResponseDTO>> getIncomingRequests() {
        Long userId = currentUserProvider.getCurrentUserId();
        List<IdResponseDTO> result = connectionService.getIncomingRequests(userId).stream()
                .map(c -> new IdResponseDTO(c.getId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // Надіслати запит на з'єднання
    @PostMapping("/{targetId}")
    public ResponseEntity<Void> requestConnection(@PathVariable Long targetId) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.requestConnection(userId, targetId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // Прийняти або відхилити вхідний запит:
    // /connections/{connectionId}/respond?accept=true
    @PatchMapping("/{connectionId}/respond")
    public ResponseEntity<Void> respondToRequest(@PathVariable Long connectionId,
            @RequestParam boolean accept) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.respondToRequest(connectionId, userId, accept);
        return ResponseEntity.ok().build();
    }

    // Розірвати існуюче з'єднання
    @DeleteMapping("/{otherUserId}")
    public ResponseEntity<Void> disconnect(@PathVariable Long otherUserId) {
        Long userId = currentUserProvider.getCurrentUserId();
        connectionService.disconnect(userId, otherUserId);
        return ResponseEntity.noContent().build();
    }
}


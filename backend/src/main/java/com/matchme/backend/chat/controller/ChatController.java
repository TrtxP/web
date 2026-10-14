package com.matchme.backend.chat.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.matchme.backend.chat.dto.ChatRequestDTO;
import com.matchme.backend.chat.dto.ChatSummaryDTO;
import com.matchme.backend.chat.model.Chat;
import com.matchme.backend.chat.model.ChatMessage;
import com.matchme.backend.chat.service.ChatService;
import com.matchme.backend.shared.security.CurrentUserProvider;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping
    public ResponseEntity<Map<String, Long>> handleGetOrCreateChat(
            @RequestBody ChatRequestDTO request) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        Chat chat = chatService.getOrCreateChat(currentUserId, request.getParticipantId());
        return ResponseEntity.ok(Collections.singletonMap("id", chat.getId()));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<Page<ChatMessage>> getMessages(
            @PathVariable Long chatId,
            Pageable pageable) {
        Page<ChatMessage> messages = chatService.getMessages(chatId, pageable);
        return ResponseEntity.ok(messages);
    }

    @GetMapping
    public ResponseEntity<List<ChatSummaryDTO>> getAllChatsForUser() {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        List<ChatSummaryDTO> chatSummaries = chatService.getUserChatSummaries(currentUserId);
        return ResponseEntity.ok(chatSummaries);
    }
}


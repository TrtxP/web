package com.matchme.backend.controllers;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
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

import com.matchme.backend.dto.ChatRequestDTO;
import com.matchme.backend.dto.ChatSummaryDTO;
import com.matchme.backend.models.Chat;
import com.matchme.backend.models.ChatMessage;
import com.matchme.backend.repositories.ChatMessageRepository;
import com.matchme.backend.repositories.ChatRepository;
import com.matchme.backend.services.ChatService;

@RestController
@RequestMapping("/chats")
public class ChatController {
    private final ChatService chatService;
    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ChatController(ChatService chatService, ChatRepository chatRepository, ChatMessageRepository chatMessageRepository) {
        this.chatService = chatService;
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    @PostMapping
    public ResponseEntity<?> handleGetOrCreateChat(
            @RequestBody ChatRequestDTO request,
            Principal principal) {
        
        Long currentUserId = Long.parseLong(principal.getName());
        Chat chat = chatService.getOrCreateChat(currentUserId, request.getParticipantId());
        
        Map<String, Long> response = new HashMap<>();
        response.put("id", chat.getId());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<Page<ChatMessage>> getMessages(
            @PathVariable Long chatId,
            Pageable pageable) {
        
        Page<ChatMessage> messages = chatMessageRepository.findByChatIdOrderBySentAtDesc(chatId, pageable);
        
        return ResponseEntity.ok(messages);
    }


    @GetMapping
    public ResponseEntity<?> getAllChatsForUser(Principal principal) {
        
        Long currentUserId = Long.parseLong(principal.getName());
        var chats = chatRepository.findAllForUserOrderByLastMessageDesc(currentUserId);
        
        List<ChatSummaryDTO> chatSummaries = new ArrayList<>();
        for (Chat chat : chats) {
            var partner = chat.getUserOne().getId().equals(currentUserId)
                    ? chat.getUserTwo()
                    : chat.getUserOne();

            ChatSummaryDTO dto = new ChatSummaryDTO();
            dto.setId(chat.getId());
            dto.setPartnerId(partner.getId());
            dto.setPartnerName(partner.getName());
            dto.setLastMessageAt(chat.getLastMessageAt());
            chatSummaries.add(dto);
        }

        return ResponseEntity.ok(chatSummaries);
    }
}

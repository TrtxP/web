package com.matchme.backend.chat.service;

import com.matchme.backend.chat.model.Chat;
import com.matchme.backend.chat.repository.ChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ChatAccessService {
    private final ChatRepository chatRepository;

    @Transactional(readOnly = true)
    public Chat requireParticipant(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat not found"));
        if (!chat.getUserOne().getId().equals(userId) && !chat.getUserTwo().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chat is only available to its participants");
        }
        return chat;
    }
}

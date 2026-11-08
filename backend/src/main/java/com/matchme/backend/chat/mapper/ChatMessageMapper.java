package com.matchme.backend.chat.mapper;

import com.matchme.backend.chat.dto.ChatMessageDTO;
import com.matchme.backend.chat.model.ChatMessage;
import org.springframework.stereotype.Component;

@Component
public class ChatMessageMapper {
    public ChatMessageDTO toDto(ChatMessage message) {
        Long senderId = message.getSender().getId();
        var chat = message.getChat();
        Long receiverId = chat.getUserOne().getId().equals(senderId)
                ? chat.getUserTwo().getId() : chat.getUserOne().getId();
        return new ChatMessageDTO(message.getId(), chat.getId(), senderId, receiverId,
                message.getContent(), message.getSentAt(), message.isRead());
    }
}

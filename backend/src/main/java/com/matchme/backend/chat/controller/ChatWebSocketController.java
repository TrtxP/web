package com.matchme.backend.chat.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.matchme.backend.chat.dto.ChatMessageDTO;
import com.matchme.backend.chat.dto.ChatReadReceiptDTO;
import com.matchme.backend.chat.dto.TypingIndicatorDTO;
import com.matchme.backend.chat.service.ChatService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;

    // Клієнт надсилає на /app/chat.send
    // senderId визначається виключно з автентифікованого Principal (JWT),
    // а не з тіла повідомлення — інакше клієнт міг би підписуватись чужим ім'ям.
    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageDTO incoming, Principal principal) {
        Long senderId = Long.parseLong(principal.getName());

        chatService.sendMessage(incoming.getChatId(), senderId, incoming.getContent());
    }

    // Клієнт надсилає на /app/chat.read при відкритті чату або перегляді повідомлень
    @MessageMapping("/chat.read")
    public void markAsRead(ChatReadReceiptDTO receipt, Principal principal) {
        Long readerId = Long.parseLong(principal.getName());
        if (receipt.getChatId() == null) return;

        chatService.markChatAsRead(receipt.getChatId(), readerId);

    }

    // Клієнт надсилає на /app/chat.typing, коли користувач набирає текст
    @MessageMapping("/chat.typing")
    public void typing(TypingIndicatorDTO indicator, Principal principal) {
        chatService.setTyping(indicator.getChatId(), Long.parseLong(principal.getName()), indicator.isTyping());
    }
}

package com.matchme.backend.chat.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.matchme.backend.chat.dto.ChatMessageDTO;
import com.matchme.backend.chat.dto.TypingIndicatorDTO;
import com.matchme.backend.chat.model.Chat;
import com.matchme.backend.chat.model.ChatMessage;
import com.matchme.backend.chat.service.ChatService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // Клієнт надсилає на /app/chat.send
    // senderId визначається виключно з автентифікованого Principal (JWT),
    // а не з тіла повідомлення — інакше клієнт міг би підписуватись чужим ім'ям.
    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageDTO incoming, Principal principal) {
        Long senderId = Long.parseLong(principal.getName());

        ChatMessage saved = chatService.sendMessage(incoming.getChatId(), senderId, incoming.getContent());
        Chat chat = saved.getChat();

        ChatMessageDTO payload = new ChatMessageDTO(
                chat.getId(),
                senderId,
                chatService.getOtherParticipantId(chat, senderId),
                saved.getContent(),
                saved.getSentAt());

        // Повідомлення надсилається обом учасникам:
        // - конкретному отримувачу в особисту чергу (для оновлення списку чатів/непрочитаних)
        // - в топік чату (щоб миттєво з'явилось у відкритому вікні чату в обох)
        messagingTemplate.convertAndSendToUser(String.valueOf(payload.getReceiverId()), "/queue/messages", payload);
        messagingTemplate.convertAndSend("/topic/chat." + chat.getId(), payload);
    }

    // Клієнт надсилає на /app/chat.typing, коли користувач набирає текст
    @MessageMapping("/chat.typing")
    public void typing(TypingIndicatorDTO indicator, Principal principal) {
        // userId в індикаторі теж перезаписуємо реальним відправником
        TypingIndicatorDTO safeIndicator = new TypingIndicatorDTO(
                indicator.getChatId(),
                Long.parseLong(principal.getName()),
                indicator.isTyping());
        messagingTemplate.convertAndSend("/topic/chat." + safeIndicator.getChatId() + ".typing", safeIndicator);
    }
}


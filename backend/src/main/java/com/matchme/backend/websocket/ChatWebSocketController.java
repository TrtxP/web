package com.matchme.backend.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.matchme.backend.dto.ChatMessageDTO;
import com.matchme.backend.dto.TypingIndicatorDTO;
import com.matchme.backend.models.Chat;
import com.matchme.backend.models.ChatMessage;
import com.matchme.backend.services.ChatService;

@Controller
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    // Клієнт надсилає на /app/chat.send
    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageDTO incoming) {
        ChatMessage saved = chatService.sendMessage(incoming.getChatId(), incoming.getSenderId(),
                incoming.getContent());
        Chat chat = saved.getChat();

        ChatMessageDTO payload = new ChatMessageDTO(
                chat.getId(),
                incoming.getSenderId(),
                chatService.getOtherParticipantId(chat, incoming.getSenderId()),
                saved.getContent(),
                saved.getSentAt());

        // Повідомлення надсилається обом учасникам:
        // - конкретному отримувачу в особисту чергу (для оновлення списку
        // чатів/непрочитаних)
        // - в топік чату (щоб миттєво з'явилось у відкритому вікні чату в обох)
        messagingTemplate.convertAndSendToUser(String.valueOf(payload.getReceiverId()), "/queue/messages", payload);
        messagingTemplate.convertAndSend("/topic/chat." + chat.getId(), payload);
    }

    // Клієнт надсилає на /app/chat.typing, коли користувач набирає текст
    @MessageMapping("/chat.typing")
    public void typing(TypingIndicatorDTO indicator) {
        messagingTemplate.convertAndSend("/topic/chat." + indicator.getChatId() + ".typing", indicator);
    }
}

package com.matchme.backend.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.models.Chat;
import com.matchme.backend.models.ChatMessage;
import com.matchme.backend.models.Connection;
import com.matchme.backend.models.ConnectionStatus;
import com.matchme.backend.models.User;
import com.matchme.backend.repositories.ChatMessageRepository;
import com.matchme.backend.repositories.ChatRepository;
import com.matchme.backend.repositories.ConnectionRepository;
import com.matchme.backend.repositories.UserRepository;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;

    public ChatService(ChatRepository chatRepository,
            ChatMessageRepository chatMessageRepository,
            ConnectionRepository connectionRepository,
            UserRepository userRepository) {
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.connectionRepository = connectionRepository;
        this.userRepository = userRepository;
    }

    // Отримати (або створити) чат між двома з'єднаними користувачами.
    // Тільки один чат може існувати між парою користувачів.
    public Chat getOrCreateChat(Long userIdA, Long userIdB) {
        Connection connection = connectionRepository.findBetweenUsers(userIdA, userIdB)
                .filter(c -> c.getStatus() == ConnectionStatus.ACCEPTED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Чат доступний лише для з'єднаних користувачів"));

        return chatRepository.findBetweenUsers(userIdA, userIdB)
                .orElseGet(() -> {
                    User userA = userRepository.getReferenceById(userIdA);
                    User userB = userRepository.getReferenceById(userIdB);
                    Chat chat = new Chat();
                    chat.setUserOne(userA);
                    chat.setUserTwo(userB);
                    return chatRepository.save(chat);
                });
    }

    public ChatMessage sendMessage(Long chatId, Long senderId, String content) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Чат не знайдено"));

        boolean senderInChat = chat.getUserOne().getId().equals(senderId) || chat.getUserTwo().getId().equals(senderId);
        if (!senderInChat) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Користувач не є учасником цього чату");
        }

        User sender = userRepository.getReferenceById(senderId);

        ChatMessage message = new ChatMessage();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(content);
        ChatMessage saved = chatMessageRepository.save(message);

        chat.setLastMessageAt(saved.getSentAt());
        chatRepository.save(chat);

        return saved;
    }

    public Long getOtherParticipantId(Chat chat, Long senderId) {
        return chat.getUserOne().getId().equals(senderId) ? chat.getUserTwo().getId() : chat.getUserOne().getId();
    }
}

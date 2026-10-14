package com.matchme.backend.chat.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.chat.dto.ChatSummaryDTO;
import com.matchme.backend.chat.model.Chat;
import com.matchme.backend.chat.model.ChatMessage;
import com.matchme.backend.chat.repository.ChatMessageRepository;
import com.matchme.backend.chat.repository.ChatRepository;
import com.matchme.backend.connection.model.ConnectionStatus;
import com.matchme.backend.connection.repository.ConnectionRepository;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;

    // Отримати (або створити) чат між двома з'єднаними користувачами.
    // Тільки один чат може існувати між парою користувачів.
    @Transactional
    public Chat getOrCreateChat(Long userIdA, Long userIdB) {
        connectionRepository.findBetweenUsers(userIdA, userIdB)
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

    @Transactional
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

    @Transactional(readOnly = true)
    public Page<ChatMessage> getMessages(Long chatId, Pageable pageable) {
        return chatMessageRepository.findByChatIdOrderBySentAtDesc(chatId, pageable);
    }

    @Transactional(readOnly = true)
    public List<ChatSummaryDTO> getUserChatSummaries(Long currentUserId) {
        List<Chat> chats = chatRepository.findAllForUserOrderByLastMessageDesc(currentUserId);
        List<ChatSummaryDTO> chatSummaries = new ArrayList<>();
        for (Chat chat : chats) {
            User partner = chat.getUserOne().getId().equals(currentUserId)
                    ? chat.getUserTwo()
                    : chat.getUserOne();

            ChatSummaryDTO dto = new ChatSummaryDTO();
            dto.setId(chat.getId());
            dto.setPartnerId(partner.getId());
            dto.setPartnerName(partner.getName());
            dto.setLastMessageAt(chat.getLastMessageAt());
            chatSummaries.add(dto);
        }
        return chatSummaries;
    }

    public Long getOtherParticipantId(Chat chat, Long senderId) {
        return chat.getUserOne().getId().equals(senderId) ? chat.getUserTwo().getId() : chat.getUserOne().getId();
    }
}


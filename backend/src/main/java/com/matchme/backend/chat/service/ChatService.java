package com.matchme.backend.chat.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.chat.dto.ChatSummaryDTO;
import com.matchme.backend.chat.dto.ChatMessageDTO;
import com.matchme.backend.chat.dto.ChatReadReceiptDTO;
import com.matchme.backend.chat.dto.TypingIndicatorDTO;
import com.matchme.backend.chat.event.ChatEvent;
import com.matchme.backend.chat.mapper.ChatMessageMapper;
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
    private final ChatAccessService chatAccessService;
    private final ChatMessageMapper messageMapper;
    private final ApplicationEventPublisher eventPublisher;

    // Отримати (або створити) чат між двома з'єднаними користувачами.
    // Тільки один чат може існувати між парою користувачів.
    @Transactional
    public Chat getOrCreateChat(Long userIdA, Long userIdB) {
        if (userIdB == null || userIdA.equals(userIdB)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose another participant");
        }
        // Serialize concurrent openChat calls for this connected pair, including reversed arguments.
        connectionRepository.findBetweenUsersForUpdate(userIdA, userIdB)
                .filter(c -> c.getStatus() == ConnectionStatus.ACCEPTED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Чат доступний лише для з'єднаних користувачів"));

        return chatRepository.findBetweenUsers(userIdA, userIdB)
                .orElseGet(() -> {
                    User userA = userRepository.getReferenceById(Math.min(userIdA, userIdB));
                    User userB = userRepository.getReferenceById(Math.max(userIdA, userIdB));
                    Chat chat = new Chat();
                    chat.setUserOne(userA);
                    chat.setUserTwo(userB);
                    return chatRepository.save(chat);
                });
    }

    @Transactional
    public ChatMessageDTO sendMessage(Long chatId, Long senderId, String content) {
        Chat chat = chatAccessService.requireParticipant(chatId, senderId);
        if (content == null || content.isBlank() || content.length() > 5000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message must contain 1 to 5000 characters");
        }

        User sender = userRepository.getReferenceById(senderId);

        ChatMessage message = new ChatMessage();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(content.strip());
        ChatMessage saved = chatMessageRepository.save(message);

        chat.setLastMessageAt(saved.getSentAt());
        chatRepository.save(chat);

        ChatMessageDTO dto = messageMapper.toDto(saved);
        publish(chat, ChatEvent.Kind.MESSAGE, dto, null, null);
        return dto;
    }

    @Transactional
    public boolean markChatAsRead(Long chatId, Long readerId) {
        Chat chat = chatAccessService.requireParticipant(chatId, readerId);
        boolean changed = chatMessageRepository.markMessagesAsRead(chatId, readerId) > 0;
        if (changed) {
            publish(chat, ChatEvent.Kind.READ, null, new ChatReadReceiptDTO(chatId, readerId), null);
        }
        return changed;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDTO> getMessages(Long chatId, Long userId, Pageable pageable) {
        chatAccessService.requireParticipant(chatId, userId);
        if (pageable.isUnpaged() || pageable.getPageNumber() > 10000 || pageable.getPageSize() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be 0..10000 and size 1..100");
        }
        return chatMessageRepository.findMessagePage(chatId,
                PageRequest.of(pageable.getPageNumber(), pageable.getPageSize()));
    }

    @Transactional
    public void setTyping(Long chatId, Long userId, boolean typing) {
        Chat chat = chatAccessService.requireParticipant(chatId, userId);
        publish(chat, ChatEvent.Kind.TYPING, null, null, new TypingIndicatorDTO(chatId, userId, typing));
    }

    private void publish(Chat chat, ChatEvent.Kind kind, ChatMessageDTO message,
                         ChatReadReceiptDTO receipt, TypingIndicatorDTO typing) {
        eventPublisher.publishEvent(new ChatEvent(kind, chat.getId(), chat.getUserOne().getId(),
                chat.getUserTwo().getId(), message, receipt, typing));
    }

    @Transactional(readOnly = true)
    public List<ChatSummaryDTO> getUserChatSummaries(Long currentUserId) {
        return chatRepository.findSummariesForUser(currentUserId);
    }
}

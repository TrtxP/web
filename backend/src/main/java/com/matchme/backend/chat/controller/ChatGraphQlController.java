package com.matchme.backend.chat.controller;

import java.util.List;
import com.matchme.backend.chat.dto.ChatMessageDTO;
import com.matchme.backend.chat.dto.ChatMessagePage;
import com.matchme.backend.chat.dto.ChatSummaryDTO;
import com.matchme.backend.chat.event.ChatEvent;
import com.matchme.backend.chat.event.ChatEventBroker;
import com.matchme.backend.chat.service.ChatAccessService;
import com.matchme.backend.chat.service.ChatService;
import com.matchme.backend.shared.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.ContextValue;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

@Controller
@RequiredArgsConstructor
public class ChatGraphQlController {
    private final ChatService chatService;
    private final ChatAccessService chatAccessService;
    private final ChatEventBroker eventBroker;
    private final JwtService jwtService;

    public record SendMessageInput(Long chatId, String content) { }

    @QueryMapping
    public List<ChatSummaryDTO> chats(@ContextValue Long userId) {
        return chatService.getUserChatSummaries(userId);
    }

    @QueryMapping
    public ChatMessagePage chatMessages(@Argument Long chatId, @Argument int page, @Argument int size,
                                        @ContextValue Long userId) {
        if (page < 0 || page > 10000 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be 0..10000 and size 1..100");
        }
        return ChatMessagePage.from(chatService.getMessages(chatId, userId, PageRequest.of(page, size)));
    }

    @MutationMapping
    public Long openChat(@Argument Long participantId, @ContextValue Long userId) {
        return chatService.getOrCreateChat(userId, participantId).getId();
    }

    @MutationMapping
    public ChatMessageDTO sendMessage(@Argument SendMessageInput input, @ContextValue Long userId) {
        return chatService.sendMessage(input.chatId(), userId, input.content());
    }

    @MutationMapping
    public boolean markChatRead(@Argument Long chatId, @ContextValue Long userId) {
        return chatService.markChatAsRead(chatId, userId);
    }

    @MutationMapping
    public boolean setChatTyping(@Argument Long chatId, @Argument boolean typing, @ContextValue Long userId) {
        chatService.setTyping(chatId, userId, typing);
        return true;
    }

    @SubscriptionMapping
    public Flux<ChatEvent> chatEvents(@Argument Long chatId, @ContextValue Long userId, @ContextValue String token) {
        if (chatId != null) {
            chatAccessService.requireParticipant(chatId, userId);
        }
        return eventBroker.forUser(userId, chatId)
                .map(event -> {
                    if (jwtService.extractUserId(token).filter(userId::equals).isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired. Please sign in again.");
                    }
                    return event;
                });
    }
}

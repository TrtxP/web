package com.matchme.backend.shared.security;

import java.security.Principal;
import java.util.Optional;
import java.util.regex.Pattern;
import com.matchme.backend.chat.service.ChatAccessService;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import jakarta.annotation.Nonnull;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final ChatAccessService chatAccessService;
    private static final Pattern CHAT_TOPIC = Pattern.compile("/topic/chat\\.(\\d+)(?:\\.(?:read|typing))?");

    public JwtChannelInterceptor(JwtService jwtService, ChatAccessService chatAccessService) {
        this.jwtService = jwtService;
        this.chatAccessService = chatAccessService;
    }

    @Override
    public Message<?> preSend(@Nonnull Message<?> message, @Nonnull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String header = accessor.getFirstNativeHeader("Authorization");

            if (header == null || !header.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Відсутній Authorization заголовок при підключенні до WebSocket");
            }

            String token = header.substring("Bearer ".length());
            Optional<Long> userId = jwtService.extractUserId(token);

            if (userId.isEmpty()) {
                throw new IllegalArgumentException("Недійсний або прострочений токен");
            }

            Principal principal = new StompPrincipal(String.valueOf(userId.get()));
            accessor.setUser(principal);
        }

        if (accessor != null && (StompCommand.SUBSCRIBE.equals(accessor.getCommand())
                || StompCommand.SEND.equals(accessor.getCommand()))) {
            Principal user = accessor.getUser();
            if (user == null) {
                throw new IllegalArgumentException("Authenticated WebSocket session required");
            }
            String destination = accessor.getDestination();
            if (StompCommand.SEND.equals(accessor.getCommand())
                    && (destination == null || !destination.startsWith("/app/"))) {
                throw new IllegalArgumentException("Messages must be sent through application handlers");
            }
            if (destination != null && destination.startsWith("/topic/chat.")) {
                var matcher = CHAT_TOPIC.matcher(destination);
                if (!matcher.matches()) {
                    throw new IllegalArgumentException("Invalid chat destination");
                }
                chatAccessService.requireParticipant(Long.parseLong(matcher.group(1)), Long.parseLong(user.getName()));
            }
        }
        return message;
    }

    public record StompPrincipal(String name) implements Principal {
        @Override
        public String getName() {
            return name;
        }
    }
}


package com.matchme.backend.security;

import java.security.Principal;
import java.util.Optional;

import jakarta.annotation.Nonnull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Клієнт передає JWT у нативному STOMP-заголовку "Authorization" фрейму CONNECT:
 *
 *   stompClient.connect({ Authorization: "Bearer <token>" }, onConnected, onError);
 *
 * Якщо токен відсутній/недійсний — з'єднання відхиляється (кидаємо виняток,
 * Spring розірве WebSocket-сесію).
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public JwtChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
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

            // Principal, доступний далі в @MessageMapping через параметр Principal,
            // а також через SimpMessagingTemplate.convertAndSendToUser(name, ...)
            Principal principal = new StompPrincipal(String.valueOf(userId.get()));
            accessor.setUser(principal);
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

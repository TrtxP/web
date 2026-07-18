package com.matchme.backend.websocket;

import com.matchme.backend.repositories.UserProfileRepository;
import com.matchme.backend.repositories.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();

        if (principal != null) {
            Long userId = getUserIdFromPrincipal(principal);
            if (userId != null) {
                log.info("User with ID {} connected to WebSocket", userId);
                // Оновлюємо статус: користувач в мережі
                userRepository.updateOnlineStatus(userId, true);
                userProfileRepository.updateLastSeenTime(userId, LocalDateTime.now());
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();

        if (principal != null) {
            Long userId = getUserIdFromPrincipal(principal);
            if (userId != null) {
                log.info("User with ID {} disconnected from WebSocket", userId);
                // Користувач вийшов з мережі, фіксуємо точний час lastSeenAt
                userRepository.updateOnlineStatus(userId, false);
                userProfileRepository.updateLastSeenTime(userId, LocalDateTime.now());
            }
        }
    }

    /**
     * Допоміжний метод для витягування ID користувача з Principal.
     * Налаштуй його залежно від того, як у тебе влаштована авторизація (наприклад,
     * CustomUserDetails).
     */
    private Long getUserIdFromPrincipal(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken) {
            try {
                return Long.parseLong(principal.getName());
            } catch (NumberFormatException e) {
                log.error("Failed parse an user ID with principal name: {}", principal.getName());
            }
        }
        return null;
    }
}
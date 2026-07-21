package com.matchme.backend.websocket;

import com.matchme.backend.dto.UserStatusUpdateDTO;
import com.matchme.backend.services.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserProfileService userProfileService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        Long userId = getUserIdFromAccessor(headerAccessor);

        if (userId != null) {
            log.info("User with ID {} connected to WebSocket", userId);

            userProfileService.updateUserStatus(userId, true);

            messagingTemplate.convertAndSend("/topic/users.status", new UserStatusUpdateDTO(userId, "ONLINE"));
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        Long userId = getUserIdFromAccessor(headerAccessor);
        if (userId != null) {
            log.info("User with ID {} disconnected from WebSocket", userId);

            userProfileService.updateUserStatus(userId, false);

            messagingTemplate.convertAndSend("/topic/users.status", new UserStatusUpdateDTO(userId, "OFFLINE"));
        }
    }

    /**
     * Допоміжний метод для витягування ID користувача з Principal.
     * Налаштуй його залежно від того, як у тебе влаштована авторизація (наприклад,
     * CustomUserDetails).
     */
    private Long getUserIdFromAccessor(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();

        if (principal != null) {
            try {
                return Long.parseLong(principal.getName());
            } catch (NumberFormatException e) {
                log.error("Failed parse an user ID with principal name: {}", principal.getName());
            }
        }
        return null;
    }
}
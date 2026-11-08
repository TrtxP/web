package com.matchme.backend.chat.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/** Compatibility delivery is isolated from the application service and GraphQL event stream. */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStompEventListener {
    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener
    public void afterCommit(ChatEvent event) {
        try {
            switch (event.kind()) {
                case MESSAGE -> {
                    messagingTemplate.convertAndSendToUser(event.message().getReceiverId().toString(),
                            "/queue/messages", event.message());
                    messagingTemplate.convertAndSend("/topic/chat." + event.chatId(), event.message());
                }
                case READ -> messagingTemplate.convertAndSend("/topic/chat." + event.chatId() + ".read", event.receipt());
                case TYPING -> messagingTemplate.convertAndSend("/topic/chat." + event.chatId() + ".typing", event.typing());
            }
        } catch (MessagingException exception) {
            // The database commit has succeeded; a transport failure must not tell clients to resend.
            log.warn("STOMP delivery failed for chat {} and event {}", event.chatId(), event.kind(), exception);
        }
    }
}

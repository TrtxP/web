package com.matchme.backend.chat.event;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@Component
public class ChatEventBroker {
    private final Sinks.Many<ChatEvent> events = Sinks.many().multicast().directBestEffort();

    public Flux<ChatEvent> forUser(Long userId, Long chatId) {
        return events.asFlux()
                .filter(event -> event.includes(userId) && (chatId == null || chatId.equals(event.chatId())))
                .onBackpressureBuffer(256);
    }

    @TransactionalEventListener
    public synchronized void afterCommit(ChatEvent event) {
        // Serializing producers avoids FAIL_NON_SERIALIZED on concurrent transactions.
        events.tryEmitNext(event);
    }
}

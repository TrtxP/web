package com.matchme.backend.chat.event;

import com.matchme.backend.chat.dto.ChatMessageDTO;
import com.matchme.backend.chat.dto.ChatReadReceiptDTO;
import com.matchme.backend.chat.dto.TypingIndicatorDTO;

/** Transport-independent snapshot; no managed JPA entities leave the transaction. */
public record ChatEvent(Kind kind, Long chatId, Long userOneId, Long userTwoId,
                        ChatMessageDTO message, ChatReadReceiptDTO receipt, TypingIndicatorDTO typing) {
    public enum Kind { MESSAGE, READ, TYPING }

    public boolean includes(Long userId) {
        return userOneId.equals(userId) || userTwoId.equals(userId);
    }
}

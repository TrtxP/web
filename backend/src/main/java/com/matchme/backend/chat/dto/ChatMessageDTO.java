package com.matchme.backend.chat.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private Long chatId;
    private Long senderId;
    private Long receiverId;
    private String content;
    private LocalDateTime sentAt;
}


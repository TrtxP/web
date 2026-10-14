package com.matchme.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TypingIndicatorDTO {
    private Long chatId;
    private Long userId;
    private boolean typing;
}


package com.matchme.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatReadReceiptDTO {
    private Long chatId;
    private Long readerId;
}

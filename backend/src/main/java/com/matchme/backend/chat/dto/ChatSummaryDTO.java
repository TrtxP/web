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
public class ChatSummaryDTO {
    private Long id;
    private Long partnerId;
    private String partnerName;
    private LocalDateTime lastMessageAt;
}


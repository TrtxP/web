package com.matchme.backend.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ChatSummaryDTO {
    private Long id;
    private Long partnerId;
    private String partnerName;
    private LocalDateTime lastMessageAt;
}

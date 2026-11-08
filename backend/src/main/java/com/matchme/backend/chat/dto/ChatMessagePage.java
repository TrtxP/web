package com.matchme.backend.chat.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record ChatMessagePage(List<ChatMessageDTO> content, int number, int size,
                              int totalPages, long totalElements, boolean last) {
    public static ChatMessagePage from(Page<ChatMessageDTO> page) {
        return new ChatMessagePage(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalPages(), page.getTotalElements(), page.isLast());
    }
}

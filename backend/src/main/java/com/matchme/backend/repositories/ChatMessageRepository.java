package com.matchme.backend.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.matchme.backend.models.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Пагінація історії чату, найновіші спочатку
    Page<ChatMessage> findByChatIdOrderBySentAtDesc(Long chatId, Pageable pageable);

    long countByChatIdAndReadFalse(Long chatId);
}

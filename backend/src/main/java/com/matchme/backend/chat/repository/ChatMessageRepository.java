package com.matchme.backend.chat.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.matchme.backend.chat.model.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Пагінація історії чату, найновіші спочатку
    Page<ChatMessage> findByChatIdOrderBySentAtDesc(Long chatId, Pageable pageable);

    long countByChatIdAndReadFalse(Long chatId);
}


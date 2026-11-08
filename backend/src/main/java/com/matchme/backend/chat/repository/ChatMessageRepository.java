package com.matchme.backend.chat.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.matchme.backend.chat.model.ChatMessage;
import com.matchme.backend.chat.dto.ChatMessageDTO;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Пагінація історії чату, найновіші спочатку
    @Query(value = """
            SELECT new com.matchme.backend.chat.dto.ChatMessageDTO(
                m.id, m.chat.id, m.sender.id,
                CASE WHEN m.chat.userOne.id = m.sender.id THEN m.chat.userTwo.id ELSE m.chat.userOne.id END,
                m.content, m.sentAt, m.read)
            FROM ChatMessage m WHERE m.chat.id = :chatId ORDER BY m.sentAt DESC, m.id DESC
            """, countQuery = "SELECT count(m) FROM ChatMessage m WHERE m.chat.id = :chatId")
    Page<ChatMessageDTO> findMessagePage(@Param("chatId") Long chatId, Pageable pageable);

    long countByChatIdAndReadFalse(Long chatId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.chat.id = :chatId AND m.sender.id <> :readerId AND m.read = false")
    int markMessagesAsRead(@Param("chatId") Long chatId, @Param("readerId") Long readerId);
}

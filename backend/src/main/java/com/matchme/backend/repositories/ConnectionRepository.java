package com.matchme.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.matchme.backend.models.Connection;
import com.matchme.backend.models.ConnectionStatus;

public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    // Знайти будь-який запис між двома користувачами (в будь-якому напрямку)
    @Query("SELECT c FROM Connection c WHERE " +
            "(c.requester.id = :userIdA AND c.receiver.id = :userIdB) OR " +
            "(c.requester.id = :userIdB AND c.receiver.id = :userIdA)")
    Optional<Connection> findBetweenUsers(@Param("userIdA") Long userIdA, @Param("userIdB") Long userIdB);

    // Усі id користувачів, які треба виключити з рекомендацій для userId
    // (вже є запит, з'єднання, відмова або dismiss в будь-якому напрямку)
    @Query("SELECT CASE WHEN c.requester.id = :userId THEN c.receiver.id ELSE c.requester.id END " +
            "FROM Connection c WHERE c.requester.id = :userId OR c.receiver.id = :userId")
    List<Long> findExcludedUserIds(@Param("userId") Long userId);

    // Усі прийняті з'єднання користувача -> id другого учасника
    @Query("SELECT CASE WHEN c.requester.id = :userId THEN c.receiver.id ELSE c.requester.id END " +
            "FROM Connection c WHERE (c.requester.id = :userId OR c.receiver.id = :userId) " +
            "AND c.status = com.matchme.backend.models.ConnectionStatus.ACCEPTED")
    List<Long> findAcceptedConnectionUserIds(@Param("userId") Long userId);

    // Вхідні запити на з'єднання (очікують рішення) для користувача
    List<Connection> findByReceiverIdAndStatus(Long receiverId, ConnectionStatus status);

    // Надіслані запити користувача
    List<Connection> findByRequesterIdAndStatus(Long requesterId, ConnectionStatus status);
}

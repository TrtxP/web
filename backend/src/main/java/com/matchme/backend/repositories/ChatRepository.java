package com.matchme.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.matchme.backend.models.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Query("SELECT c FROM Chat c WHERE " +
            "(c.userOne.id = :userIdA AND c.userTwo.id = :userIdB) OR " +
            "(c.userOne.id = :userIdB AND c.userTwo.id = :userIdA)")
    Optional<Chat> findBetweenUsers(@Param("userIdA") Long userIdA, @Param("userIdB") Long userIdB);

    @Query("SELECT c FROM Chat c WHERE c.userOne.id = :userId OR c.userTwo.id = :userId " +
            "ORDER BY c.lastMessageAt DESC NULLS LAST")
    List<Chat> findAllForUserOrderByLastMessageDesc(@Param("userId") Long userId);
}

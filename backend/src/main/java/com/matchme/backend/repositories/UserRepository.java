package com.matchme.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.matchme.backend.models.User;

import jakarta.transaction.Transactional;

public interface UserRepository extends JpaRepository<User, Long> {
        Optional<User> findByEmail(String email);

        boolean existsByEmail(String email);

        @Modifying(clearAutomatically = true)
        @Transactional
        @Query("UPDATE User u SET u.isOnline = :isOnline WHERE u.id = :userId")
        void updateOnlineStatus(@Param("userId") Long userId, @Param("isOnline") boolean isOnline);

        @Query(value = "SELECT u.* FROM users u " +
                        "JOIN user_profiles up ON u.id = up.user_id " +
                        "JOIN user_bios ub ON u.id = ub.user_id " +
                        "WHERE u.id != :currentUserId " +
                        "AND (:targetGender IS NULL OR up.gender ILIKE :targetGender) " +
                        "AND (:mustLikeWalks = false OR ub.likes_long_walks = true) " +
                        "AND (:hasInterests = false OR ub.interests && CAST(:userInterests AS varchar[]))", nativeQuery = true)
        List<User> findRecommendationsNative(
                        @Param("currentUserId") Long currentUserId,
                        @Param("targetGender") String targetGender,
                        @Param("mustLikeWalks") boolean mustLikeWalks,
                        @Param("userInterests") String[] userInterests,
                        @Param("hasInterests") boolean hasInterests);
}

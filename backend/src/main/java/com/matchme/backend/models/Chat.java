package com.matchme.backend.models;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "chats", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_one_id", "user_two_id" })
})
@Data
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_one_id", nullable = false)
    @JsonIgnore
    private User userOne;

    @ManyToOne
    @JoinColumn(name = "user_two_id", nullable = false)
    @JsonIgnore
    private User userTwo;

    private LocalDateTime lastMessageAt;

    @PrePersist
    public void onCreate() {
        this.lastMessageAt = LocalDateTime.now();
    }
}

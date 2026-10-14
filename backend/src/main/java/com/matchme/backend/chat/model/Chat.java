package com.matchme.backend.chat.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.matchme.backend.user.model.User;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "chats", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_one_id", "user_two_id" })
})
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"userOne", "userTwo"})
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
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


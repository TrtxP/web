package com.matchme.backend.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "user_bios")
@Data
public class UserBio {
    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String interestInterests;
    private String favoriteFood;
    private String favoriteMusic;
    private boolean likesLongWalks;
    private String lookingFor;
}

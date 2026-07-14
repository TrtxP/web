package com.matchme.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_bios")
@Getter
@Setter
@Data
public class UserBio {
    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Size(min = 3, max = 8, message = "Too many interests")
    private String @Pattern(regexp = "^[a-zA-Z\\s',.-:]+$", message = "Invalid information about interests") [] interests;

    @Pattern(regexp = "^[a-zA-Z\\s',.-]+$", message = "Invalid infromation about favorite food")
    private String favoriteFood;

    @Pattern(regexp = "^[a-zA-Z\\s',.-:]+$", message = "Invalid information about favorite music")
    private String favoriteMusic;

    private boolean likesLongWalks;

    @Pattern(regexp = "^[a-zA-Z\\s',.-]+$", message = "Invalid information about searching")
    private String lookingFor;
}

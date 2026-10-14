package com.matchme.backend.user.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "user_bios")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "user")
public class UserBio {

    @Id
    @EqualsAndHashCode.Include
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

    @Pattern(regexp = "^[a-zA-Z\\s',.-]*$", message = "Invalid information about searching")
    private String lookingFor;
}


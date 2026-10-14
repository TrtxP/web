package com.matchme.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserBioResponseDTO {
    private Long id;
    private String[] interests;
    private String favoriteFood;
    private String favoriteMusic;
    private boolean likesLongWalks;
    private String lookingFor;
}


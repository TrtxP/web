package com.matchme.backend.dto;

import lombok.Data;

@Data
public class UserBioResponseDTO {
    private Long id;
    private String[] interests;
    private String favoriteFood;
    private String favoriteMusic;
    private boolean likesLongWalks;
    private String lookingFor; 
}

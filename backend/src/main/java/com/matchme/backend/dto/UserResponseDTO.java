package com.matchme.backend.dto;

import lombok.Data;

@Data
public class UserResponseDTO {
    private Long id;
    private String name;
    private String profilePictureUrl;
}

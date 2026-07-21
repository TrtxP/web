package com.matchme.backend.dto;

import lombok.Data;

@Data
public class MyPrivateProfileResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String profilePictureUrl;
}

package com.matchme.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MyPrivateProfileResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String profilePictureUrl;
}


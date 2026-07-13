package com.matchme.backend.dto;

import lombok.Data;

@Data
public class UserProfileResponseDTO {
    private String aboutMe;
    private String city;
    private Integer age;
    private String gender;
}

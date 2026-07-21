package com.matchme.backend.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserProfileResponseDTO {
    private String aboutMe;
    private String city;
    private Integer age;
    private String gender;
    private Double latitude;
    private Double longitude;
    private Integer preferredDistance;
    private Boolean recommendByCityOnly;
    private Boolean isOnline;
    private LocalDateTime lastSeenAt;
}

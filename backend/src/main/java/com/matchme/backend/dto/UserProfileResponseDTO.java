package com.matchme.backend.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

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

    @com.fasterxml.jackson.annotation.JsonProperty("isOnline")
    private boolean isOnline;

    private LocalDateTime lastSeenAt;

    public void setIsOnline(Boolean isOnline) {
        this.isOnline = Boolean.TRUE.equals(isOnline);
    }

    @JsonProperty("isOnline")
    public boolean isOnline() {
        return isOnline;
    }
}

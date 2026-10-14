package com.matchme.backend.user.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserProfileResponseDTO {
    private String aboutMe;
    private String city;
    private Integer age;
    private String gender;
    private Double latitude;
    private Double longitude;
    private Integer preferredDistance;
    private Boolean recommendByCityOnly;

    @JsonProperty("isOnline")
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


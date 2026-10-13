package com.matchme.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class UserResponseDTO {
    private Long id;
    private String name;
    private String profilePictureUrl;

    @com.fasterxml.jackson.annotation.JsonProperty("isOnline")
    private boolean isOnline;

    public void setIsOnline(Boolean isOnline) {
        this.isOnline = Boolean.TRUE.equals(isOnline);
    }

    @JsonProperty("isOnline")
    public boolean isOnline() {
        return isOnline;
    }
}

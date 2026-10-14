package com.matchme.backend.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserResponseDTO {
    private Long id;
    private String name;
    private String profilePictureUrl;

    @JsonProperty("isOnline")
    private boolean isOnline;

    public void setIsOnline(Boolean isOnline) {
        this.isOnline = Boolean.TRUE.equals(isOnline);
    }

    @JsonProperty("isOnline")
    public boolean isOnline() {
        return isOnline;
    }
}


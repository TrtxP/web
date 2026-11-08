package com.matchme.backend.shared.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusUpdateDTO {
    @JsonProperty("userId")
    private Long id;
    private String status;

    @JsonProperty("id")
    public Long getIdAlias() {
        return this.id;
    }
}

package com.matchme.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserStatusUpdateDTO {
    private Long id;
    private String status;
}

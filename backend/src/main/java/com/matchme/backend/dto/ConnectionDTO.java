package com.matchme.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConnectionDTO {
    private Long id;
    private Long requesterId;
    private Long receiverId;
    private String status;
}

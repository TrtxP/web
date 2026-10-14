package com.matchme.backend.connection.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionDTO {
    private Long id;
    private Long requesterId;
    private Long receiverId;
    private String status;
}


package com.matchme.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDTO {
    @NotBlank(message = "Email мусить бути вказаний")
    private String email;

    @NotBlank(message = "Пароль мусить бути вказаний")
    private String password;
}

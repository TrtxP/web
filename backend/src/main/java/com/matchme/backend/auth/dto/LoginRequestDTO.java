package com.matchme.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginRequestDTO {

    @NotBlank(message = "Email мусить бути вказаний")
    private String email;

    @NotBlank(message = "Пароль мусить бути вказаний")
    private String password;
}


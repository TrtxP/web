package com.matchme.backend.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Email mustn't be empty!")
    @Size(max = 100, message = "Email is too long!")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "Invalid email format")
    @Column(unique = true)
    private String email;

    @NotBlank(message = "Password mustn't be empty!")
    @Size(min = 8, max = 64, message = "Password must be in range from 8 to 64 characters!")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_]).*$", message = "Password is too weak (must be letters in different registers, numbers and special characters")
    private String password;

    @NotBlank(message = "Name mustn't be empty!")
    @Size(min = 2, max = 50, message = "Name must be in range from 2 to 50 characters!")
    @Pattern(regexp = "^[a-zA-Z0-9\\s'-.:\b]+$", message = "Name has invalid symbols")
    private String name;

    @Pattern(regexp = "^(https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*))?|(\\/uploads\\/.*)?$", message = "Invalid profile picture URL")
    private String profilePictureUrl;
}

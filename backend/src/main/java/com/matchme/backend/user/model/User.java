package com.matchme.backend.user.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"userProfile", "userBio"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
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

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserProfile userProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserBio userBio;
}


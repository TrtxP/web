package com.matchme.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity
@Table(name = "user_profiles")
@Data
public class UserProfile {
    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Column(columnDefinition = "TEXT")
    @Pattern(regexp = "^[a-zA-Z\\s',.-:]+$", message = "Ivalid user information")
    private String aboutMe;

    @NotBlank(message = "City mustn't be empty")
    @Size(max = 100)
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Ivalid city name")
    private String city;

    @Min(value = 18, message = "You should be older than 18!")
    @Max(value = 120, message = "Ivalid age")
    private Integer age;

    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Ivalid gender")
    private String gender;
}

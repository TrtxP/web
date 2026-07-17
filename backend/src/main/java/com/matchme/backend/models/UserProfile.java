package com.matchme.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
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

    @Size(max = 100)
    // Allow letters from any language (including Cyrillic), digits, spaces and
    // common punctuation used in
    // location names (apostrophe, hyphen, comma, period, parentheses).
    @Pattern(regexp = "^[\\p{L}\\d\\s'\\-.,()]*$", message = "Invalid city name")
    private String city;

    @Min(value = 18, message = "You should be older than 18!")
    @Max(value = 120, message = "Ivalid age")
    private Integer age;

    @Pattern(regexp = "^[a-zA-Z\\s'-]*$", message = "Ivalid gender")
    private String gender;

    private Double latitude;
    private Double longitude;

    private Integer preferredDistance = 50;

    // Якщо true — рекомендації показуються лише користувачам з того самого
    // міста (city, точний збіг без урахування регістру), геодистанція
    // (latitude/longitude/preferredDistance) при цьому ігнорується.
    // Boolean (не примітив), щоб коректно розрізняти "поле не передане"
    // від "явно встановлено false" при PATCH — так само, як з likesLongWalks.
    private Boolean recommendByCityOnly = false;
}

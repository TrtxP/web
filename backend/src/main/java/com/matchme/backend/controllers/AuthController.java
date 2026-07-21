package com.matchme.backend.controllers;

import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.dto.LoginRequestDTO;
import com.matchme.backend.dto.LoginResponseDTO;
import com.matchme.backend.models.User;
import com.matchme.backend.repositories.UserProfileRepository;
import com.matchme.backend.repositories.UserRepository;
import com.matchme.backend.security.JwtService;

import jakarta.validation.Valid;
import net.datafaker.Faker;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невірний email або пароль"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невірний email або пароль");
        }

        userProfileRepository.updateOnlineStatus(user.getId(), true);

        String token = jwtService.generateToken(user.getId());
        return ResponseEntity.ok(new LoginResponseDTO(user.getId(), token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody LoginRequestDTO request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is already existed with this email.");
        }

        Faker faker = new Faker(Locale.ENGLISH);

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        String defaultName = request.getEmail().split("@")[0];
        newUser.setName(defaultName);

        com.matchme.backend.models.UserProfile emptyProfile = new com.matchme.backend.models.UserProfile();
        emptyProfile.setUser(newUser);
        emptyProfile.setCity("");
        emptyProfile.setGender("");
        emptyProfile.setLatitude(faker.number().randomDouble(4, 45, 51));
        emptyProfile.setLongitude(faker.number().randomDouble(4, 24, 39));
        emptyProfile.setPreferredDistance(faker.number().numberBetween(30, 150));
        emptyProfile.setLastSeenAt(LocalDateTime.now());
        newUser.setUserProfile(emptyProfile);

        com.matchme.backend.models.UserBio emptyBio = new com.matchme.backend.models.UserBio();
        emptyBio.setUser(newUser);
        emptyBio.setLookingFor("");
        newUser.setUserBio(emptyBio);

        User savedUser = userRepository.save(newUser);

        String token = jwtService.generateToken(savedUser.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(new LoginResponseDTO(savedUser.getId(), token));
    }
}

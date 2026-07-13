package com.matchme.backend.controllers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
import com.matchme.backend.repositories.UserBioRepository;
import com.matchme.backend.repositories.UserProfileRepository;
import com.matchme.backend.repositories.UserRepository;
import com.matchme.backend.security.JwtService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserBioRepository userBioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          UserProfileRepository userProfileRepository,
                          UserBioRepository userBioRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userProfileRepository = userProfileRepository;
        this.userBioRepository = userBioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невірний email або пароль"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невірний email або пароль");
        }

        String token = jwtService.generateToken(user.getId());
        return ResponseEntity.ok(new LoginResponseDTO(user.getId(), token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody LoginRequestDTO request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is already existed with this email.");
        }

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        String defaultName = request.getEmail().split("@")[0];
        newUser.setName(defaultName);
        User savedUser = userRepository.save(newUser);

        com.matchme.backend.models.UserProfile defaultProfile = new com.matchme.backend.models.UserProfile();
        defaultProfile.setUser(savedUser);
        defaultProfile.setAboutMe("About me section is empty yet.");
        defaultProfile.setCity("Not specified");
        defaultProfile.setAge(18); 
        defaultProfile.setGender("Not specified");
        userProfileRepository.save(defaultProfile);

        com.matchme.backend.models.UserBio defaultBio = new com.matchme.backend.models.UserBio();
        defaultBio.setUser(savedUser);
        defaultBio.setLikesLongWalks(false);
        defaultBio.setFavoriteFood("Not specified");
        defaultBio.setFavoriteMusic("Not specified");
        defaultBio.setLookingFor("Friends");
        List<String> interests = new ArrayList<>(List.of("Music", "Cinema", "Books", "Sports", "Coding", "Gaming", "Cooking", "Travel"));
        Collections.shuffle(interests);
        int size = 4;
        String[] selectedInterests = interests.subList(0, size).toArray(new String[0]);
        defaultBio.setInterests(selectedInterests);
        userBioRepository.save(defaultBio);

        String token = jwtService.generateToken(savedUser.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(new LoginResponseDTO(savedUser.getId(), token));
    }
}

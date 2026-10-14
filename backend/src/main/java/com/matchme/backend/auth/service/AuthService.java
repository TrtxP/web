package com.matchme.backend.auth.service;

import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.auth.dto.LoginRequestDTO;
import com.matchme.backend.auth.dto.LoginResponseDTO;
import com.matchme.backend.shared.security.JwtService;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.model.UserBio;
import com.matchme.backend.user.model.UserProfile;
import com.matchme.backend.user.repository.UserProfileRepository;
import com.matchme.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невірний email або пароль"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Невірний email або пароль");
        }

        userProfileRepository.updateOnlineStatus(user.getId(), true);

        String token = jwtService.generateToken(user.getId());
        return new LoginResponseDTO(user.getId(), token);
    }

    @Transactional
    public LoginResponseDTO register(LoginRequestDTO request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is already existed with this email.");
        }

        Faker faker = new Faker(Locale.ENGLISH);

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        String defaultName = request.getEmail().split("@")[0];
        newUser.setName(defaultName);

        UserProfile emptyProfile = new UserProfile();
        emptyProfile.setUser(newUser);
        emptyProfile.setCity("");
        emptyProfile.setGender("");
        emptyProfile.setLatitude(faker.number().randomDouble(4, 45, 51));
        emptyProfile.setLongitude(faker.number().randomDouble(4, 24, 39));
        emptyProfile.setPreferredDistance(faker.number().numberBetween(30, 150));
        emptyProfile.setLastSeenAt(LocalDateTime.now());
        newUser.setUserProfile(emptyProfile);

        UserBio emptyBio = new UserBio();
        emptyBio.setUser(newUser);
        emptyBio.setLookingFor("");
        newUser.setUserBio(emptyBio);

        User savedUser = userRepository.save(newUser);

        String token = jwtService.generateToken(savedUser.getId());

        return new LoginResponseDTO(savedUser.getId(), token);
    }
}


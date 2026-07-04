package com.matchme.backend.services;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.models.User;
import com.matchme.backend.models.UserBio;
import com.matchme.backend.repositories.UserBioRepository;
import com.matchme.backend.repositories.UserRepository;

@Service
public class UserBioService {
    private final UserRepository userRepository;
    private final UserBioRepository userBioRepository;

    public UserBioService(UserRepository userRepository, UserBioRepository userBioRepository) {
        this.userRepository = userRepository;
        this.userBioRepository = userBioRepository;
    }

    public UserBio getBioInfo(Long id) {
        return userBioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public UserBio createUserBio(Long userId, UserBio userBio) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        User savedUser = optionalUser.get();

        userBio.setUser(savedUser);

        return userBioRepository.save(userBio);
    }

    public UserBio updateBioFull(Long userId, UserBio newBio) {
        Optional<UserBio> optionalBio = userBioRepository.findById(userId);

        if (optionalBio.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        UserBio existingBio = optionalBio.get();

        existingBio.setInterests(newBio.getInterests());
        existingBio.setFavoriteFood(newBio.getFavoriteFood());
        existingBio.setFavoriteMusic(newBio.getFavoriteMusic());
        existingBio.setLikesLongWalks(newBio.isLikesLongWalks());
        existingBio.setLookingFor(newBio.getLookingFor());

        return userBioRepository.save(existingBio);
    }

    public UserBio updateBioPartial(Long userId, UserBio updatedFields) {
        Optional<UserBio> optionalBio = userBioRepository.findById(userId);

        if (optionalBio.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        UserBio existingBio = optionalBio.get();

        if (updatedFields.getInterests() != null) {
            existingBio.setInterests(updatedFields.getInterests());
        }

        if (updatedFields.getFavoriteFood() != null) {
            existingBio.setFavoriteFood(updatedFields.getFavoriteFood());
        }

        if (updatedFields.getFavoriteMusic() != null) {
            existingBio.setFavoriteMusic(updatedFields.getFavoriteMusic());
        }

        if (updatedFields.isLikesLongWalks()) {
            existingBio.setLikesLongWalks(updatedFields.isLikesLongWalks());
        }

        if (updatedFields.getLookingFor() != null) {
            existingBio.setLookingFor(updatedFields.getLookingFor());
        }

        return userBioRepository.save(existingBio);
    }

    public void deleteBio(Long userId) {
        if (userBioRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        userBioRepository.deleteById(userId);
    }
}

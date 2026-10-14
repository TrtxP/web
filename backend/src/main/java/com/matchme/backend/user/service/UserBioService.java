package com.matchme.backend.user.service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.user.dto.UserBioPatchDTO;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.model.UserBio;
import com.matchme.backend.user.repository.UserBioRepository;
import com.matchme.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserBioService {

    private final UserRepository userRepository;
    private final UserBioRepository userBioRepository;

    @Transactional(readOnly = true)
    public UserBio getBioInfo(Long id) {
        return userBioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional
    public UserBio createUserBio(Long userId, UserBio userBio) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        User savedUser = optionalUser.get();
        userBio.setUser(savedUser);

        return userBioRepository.save(userBio);
    }

    @Transactional
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

    /**
     * Часткове оновлення. На відміну від попередньої версії, приймає
     * UserBioPatchDTO (а не entity UserBio) саме через те, що likesLongWalks
     * там — Boolean, а не примітивний boolean. Це дозволяє коректно
     * розрізнити "поле не передане" (null) від "явно встановлено false".
     */
    @Transactional
    public UserBio updateBioPartial(Long userId, UserBioPatchDTO updatedFields) {
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

        if (updatedFields.getLikesLongWalks() != null) {
            existingBio.setLikesLongWalks(updatedFields.getLikesLongWalks());
        }

        if (updatedFields.getLookingFor() != null) {
            existingBio.setLookingFor(updatedFields.getLookingFor());
        }

        return userBioRepository.save(existingBio);
    }

    @Transactional
    public void deleteBio(Long userId) {
        if (userBioRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        userBioRepository.deleteById(userId);
    }
}


package com.matchme.backend.services;

import java.util.Optional;

import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.models.User;
import com.matchme.backend.models.UserProfile;
import com.matchme.backend.repositories.UserProfileRepository;
import com.matchme.backend.repositories.UserRepository;

@Service
public class UserProfileService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public UserProfileService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public UserProfile getProfileInfo(Long id) {
        return userProfileRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public UserProfile createUserProfile(Long userId, UserProfile profile) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        User savedUser = optionalUser.get();
        profile.setUser(savedUser);

        PolicyFactory sanitizer = Sanitizers.FORMATTING;

        if (profile.getAboutMe() != null) {
            String cleanAboutMe = sanitizer.sanitize(profile.getAboutMe());
            profile.setAboutMe(cleanAboutMe);
        }

        return userProfileRepository.save(profile);
    }

    public UserProfile updateProfileFull(Long userId, UserProfile newProfile) {
        Optional<UserProfile> optionalUser = userProfileRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        UserProfile existingProfile = optionalUser.get();

        existingProfile.setAboutMe(newProfile.getAboutMe());
        existingProfile.setCity(newProfile.getCity());
        existingProfile.setAge(newProfile.getAge());
        existingProfile.setGender(newProfile.getGender());

        return userProfileRepository.save(existingProfile);
    }

    public UserProfile updateProfilePartial(Long userId, UserProfile updatedFields) {
        Optional<UserProfile> optionalUSer = userProfileRepository.findById(userId);

        if (optionalUSer.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        UserProfile existingProfile = optionalUSer.get();

        if (updatedFields.getAboutMe() != null) {
            existingProfile.setAboutMe(updatedFields.getAboutMe());
        }

        if (updatedFields.getCity() != null) {
            existingProfile.setCity(updatedFields.getCity());
        }

        if (updatedFields.getAge() != null) {
            existingProfile.setAge(updatedFields.getAge());
        }

        if (updatedFields.getGender() != null) {
            existingProfile.setAge(updatedFields.getAge());
        }

        return userProfileRepository.save(existingProfile);
    }

    public void deleteProfile(Long userId) {
        if (userProfileRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        userProfileRepository.deleteById(userId);
    }
}

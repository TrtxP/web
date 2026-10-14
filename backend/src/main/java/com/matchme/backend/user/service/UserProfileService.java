package com.matchme.backend.user.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.user.dto.UserProfileResponseDTO;
import com.matchme.backend.user.mapper.UserMapper;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.model.UserProfile;
import com.matchme.backend.user.repository.UserProfileRepository;
import com.matchme.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private static final PolicyFactory SANITIZER = Sanitizers.FORMATTING;

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserProfile getProfileInfo(Long id) {
        return userProfileRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public UserProfileResponseDTO getProfileResponseDTO(Long id) {
        UserProfile userProfile = getProfileInfo(id);
        return userMapper.toUserProfileResponseDTO(userProfile);
    }

    @Transactional
    public UserProfile createUserProfile(Long userId, UserProfile profile) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        User savedUser = optionalUser.get();
        profile.setUser(savedUser);

        profile.setLastSeenAt(LocalDateTime.now());

        if (profile.getAboutMe() != null) {
            String cleanAboutMe = SANITIZER.sanitize(profile.getAboutMe());
            profile.setAboutMe(cleanAboutMe);
        }

        return userProfileRepository.save(profile);
    }

    @Transactional
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
        existingProfile.setLatitude(newProfile.getLatitude());
        existingProfile.setLongitude(newProfile.getLongitude());
        existingProfile.setPreferredDistance(newProfile.getPreferredDistance());
        existingProfile.setRecommendByCityOnly(newProfile.getRecommendByCityOnly());

        return userProfileRepository.save(existingProfile);
    }

    @Transactional
    public UserProfile updateProfilePartial(Long userId, UserProfile updatedFields) {
        Optional<UserProfile> optionalUser = userProfileRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        UserProfile existingProfile = optionalUser.get();

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
            existingProfile.setGender(updatedFields.getGender());
        }

        if (updatedFields.getLatitude() != null) {
            existingProfile.setLatitude(updatedFields.getLatitude());
        }

        if (updatedFields.getLongitude() != null) {
            existingProfile.setLongitude(updatedFields.getLongitude());
        }

        if (updatedFields.getPreferredDistance() != null) {
            existingProfile.setPreferredDistance(updatedFields.getPreferredDistance());
        }

        if (updatedFields.getRecommendByCityOnly() != null) {
            existingProfile.setRecommendByCityOnly(updatedFields.getRecommendByCityOnly());
        }

        return userProfileRepository.save(existingProfile);
    }

    @Transactional
    public void updateUserStatus(Long userId, boolean isOnline) {
        userProfileRepository.updateOnlineStatus(userId, isOnline);
        if (!isOnline) {
            userProfileRepository.updateLastSeenTime(userId, LocalDateTime.now());
        }
    }

    @Transactional
    public void deleteProfile(Long userId) {
        if (userProfileRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        userProfileRepository.deleteById(userId);
    }
}


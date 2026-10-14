package com.matchme.backend.user.mapper;

import org.springframework.stereotype.Component;

import com.matchme.backend.user.dto.MyPrivateProfileResponseDTO;
import com.matchme.backend.user.dto.UserBioResponseDTO;
import com.matchme.backend.user.dto.UserProfileResponseDTO;
import com.matchme.backend.user.dto.UserResponseDTO;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.model.UserBio;
import com.matchme.backend.user.model.UserProfile;

@Component
public class UserMapper {

    public UserResponseDTO toUserResponseDTO(User user, boolean isOnline) {
        if (user == null) {
            return null;
        }
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        dto.setIsOnline(isOnline);
        return dto;
    }

    public MyPrivateProfileResponseDTO toMyPrivateProfileResponseDTO(User user) {
        if (user == null) {
            return null;
        }
        MyPrivateProfileResponseDTO dto = new MyPrivateProfileResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        return dto;
    }

    public UserProfileResponseDTO toUserProfileResponseDTO(UserProfile profile) {
        if (profile == null) {
            return null;
        }
        UserProfileResponseDTO dto = new UserProfileResponseDTO();
        dto.setAboutMe(profile.getAboutMe());
        dto.setCity(profile.getCity());
        dto.setAge(profile.getAge());
        dto.setGender(profile.getGender());
        dto.setLatitude(profile.getLatitude());
        dto.setLongitude(profile.getLongitude());
        dto.setPreferredDistance(profile.getPreferredDistance());
        dto.setRecommendByCityOnly(profile.getRecommendByCityOnly());
        dto.setIsOnline(profile.getIsOnline());
        dto.setLastSeenAt(profile.getLastSeenAt());
        return dto;
    }

    public UserBioResponseDTO toUserBioResponseDTO(UserBio bio) {
        if (bio == null) {
            return null;
        }
        UserBioResponseDTO dto = new UserBioResponseDTO();
        dto.setId(bio.getUserId());
        dto.setInterests(bio.getInterests());
        dto.setFavoriteFood(bio.getFavoriteFood());
        dto.setFavoriteMusic(bio.getFavoriteMusic());
        dto.setLikesLongWalks(bio.isLikesLongWalks());
        dto.setLookingFor(bio.getLookingFor());
        return dto;
    }
}


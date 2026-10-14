package com.matchme.backend.recommendation.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.matchme.backend.connection.repository.ConnectionRepository;
import com.matchme.backend.shared.util.GeoUtils;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.model.UserBio;
import com.matchme.backend.user.model.UserProfile;
import com.matchme.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final int MAX_RECOMMENDATIONS = 10;

    // Мінімальний скор, нижче якого рекомендація вважається "слабкою"
    // і не повинна показуватись користувачу.
    private static final int MIN_SCORE_THRESHOLD = 2;

    private static final int MAX_AGE_DIFFERENCE_FOR_BONUS = 5;

    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;

    @Transactional(readOnly = true)
    public List<Long> getRecommendations(Long userId) {
        User currentUser = userRepository.findByIdWithProfileAndBio(userId).orElse(null);
        if (currentUser == null) {
            return new ArrayList<>();
        }

        if (!isProfileComplete(currentUser)) {
            return new ArrayList<>();
        }

        UserProfile myProfile = currentUser.getUserProfile();
        UserBio myBio = currentUser.getUserBio();

        if (myProfile == null || myBio == null || myProfile.getCity() == null || myProfile.getAge() == null
                || myBio.getLookingFor() == null) {
            return new ArrayList<>();
        }

        List<Long> excludedIds = new ArrayList<>(connectionRepository.findExcludedUserIds(userId));

        String targetGender = null;
        if (myBio.getLookingFor() != null) {
            String lookingFor = myBio.getLookingFor().trim().toLowerCase();
            String userGender = myProfile.getGender().trim().toLowerCase();

            if ((lookingFor.equals("relationships") || lookingFor.equals("relationship")
                    || lookingFor.contains("relation")) && (userGender.equals("male"))) {
                targetGender = "female";

            } else if ((lookingFor.equals("relationships") || lookingFor.equals("relationship")
                    || lookingFor.contains("relation")) && (userGender.equals("female"))) {
                targetGender = "male";

            } else if (lookingFor.equals("friends") || lookingFor.equals("friend")) {
                targetGender = null;

            } else {
                if (lookingFor.contains("woman") || lookingFor.contains("women") || lookingFor.contains("female")) {
                    targetGender = "female";
                } else if (lookingFor.contains("man") || lookingFor.contains("men") || lookingFor.contains("male")) {
                    targetGender = "male";
                }
            }
        }

        final String finalTargetGender = targetGender;

        List<User> candidates = userRepository.findAllCandidatesWithProfileAndBio(userId).stream()
                .filter(u -> !excludedIds.contains(u.getId()))
                .filter(u -> !Objects.equals(u.getId(), userId))
                .collect(Collectors.toList());

        return candidates.stream()
                .map(candidateUser -> {
                    if (candidateUser == null || !isProfileComplete(candidateUser)) {
                        return null;
                    }

                    UserProfile candidateProfile = candidateUser.getUserProfile();
                    UserBio candidateBio = candidateUser.getUserBio();

                    if (candidateProfile == null || candidateBio == null) {
                        return null;
                    }

                    if (finalTargetGender != null) {
                        if (candidateProfile.getGender() == null ||
                                !candidateProfile.getGender().equalsIgnoreCase(finalTargetGender)) {
                            return null;
                        }
                    }

                    if (myBio.isLikesLongWalks()) {
                        if (!candidateBio.isLikesLongWalks()) {
                            return null;
                        }
                    }

                    if (!hasCommonInterests(myBio.getInterests(), candidateBio.getInterests())) {
                        return null;
                    }

                    if (myProfile.getCity() == null || candidateProfile.getCity() == null) {
                        return null;
                    }

                    if (!myProfile.getCity().equalsIgnoreCase(candidateProfile.getCity())) {
                        if (Boolean.TRUE.equals(myProfile.getRecommendByCityOnly())) {
                            // Користувач хоче бачити рекомендації лише зі свого міста —
                            // геодистанція в цьому режимі не враховується взагалі.
                            return null;
                        }

                        if (myProfile.getLatitude() == null || myProfile.getLongitude() == null
                                || candidateProfile.getLatitude() == null || candidateProfile.getLongitude() == null) {
                            return null;
                        }

                        double distanceKm = GeoUtils.calculateDistance(
                                myProfile.getLatitude(), myProfile.getLongitude(),
                                candidateProfile.getLatitude(), candidateProfile.getLongitude());

                        int maxAllowedDistance = myProfile.getPreferredDistance() != null
                                ? myProfile.getPreferredDistance()
                                : 50;

                        if (distanceKm > maxAllowedDistance) {
                            return null;
                        }
                    }

                    int score = computeScore(myBio, candidateBio, myProfile, candidateProfile);

                    if (score < MIN_SCORE_THRESHOLD) {
                        return null;
                    }

                    return new ScoredCandidate(candidateUser.getId(), score);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(ScoredCandidate::score).reversed())
                .limit(MAX_RECOMMENDATIONS)
                .map(ScoredCandidate::userId)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isProfileComplete(Long userId) {
        return userRepository.findByIdWithProfileAndBio(userId)
                .map(this::isProfileComplete)
                .orElse(false);
    }

    public boolean isProfileComplete(User user) {
        if (user == null) {
            return false;
        }

        UserProfile profile = user.getUserProfile();
        UserBio bio = user.getUserBio();

        if (profile == null || bio == null) {
            return false;
        }

        boolean hasCity = profile.getCity() != null && !profile.getCity().trim().isEmpty();
        boolean hasGender = profile.getGender() != null && !profile.getGender().trim().isEmpty();
        boolean hasLookingFor = bio.getLookingFor() != null && !bio.getLookingFor().trim().isEmpty();
        boolean hasAge = profile.getAge() != null && profile.getAge() > 0;
        boolean hasName = user.getName() != null && !user.getName().trim().isEmpty();

        return hasCity && hasGender && hasLookingFor && hasAge && hasName;
    }

    /**
     * Скоринг базується мінімум на 5 біографічних точках даних:
     * 1. interests (інтереси)
     * 2. favoriteFood (улюблена їжа)
     * 3. favoriteMusic (улюблена музика)
     * 4. likesLongWalks (любить довгі прогулянки)
     * 5. lookingFor (що шукає — має збігатись, як і у прикладі з Марса/Венери)
     * + бонус за близький вік (з профілю)
     */
    private int computeScore(UserBio myBio, UserBio candidateBio, UserProfile myProfile, UserProfile candidateProfile) {
        int score = 0;

        if (equalsIgnoreCaseSafeInterests(myBio.getInterests(), candidateBio.getInterests())) {
            score += 2;
        }

        if (equalsIgnoreCaseSafe(myBio.getFavoriteFood(), candidateBio.getFavoriteFood())) {
            score += 1;
        }

        if (equalsIgnoreCaseSafe(myBio.getFavoriteMusic(), candidateBio.getFavoriteMusic())) {
            score += 1;
        }

        if (myBio.isLikesLongWalks() == candidateBio.isLikesLongWalks()) {
            score += 1;
        }

        if (equalsIgnoreCaseSafe(myBio.getLookingFor(), candidateBio.getLookingFor())) {
            score += 2;
        }

        if (myProfile.getAge() != null && candidateProfile.getAge() != null) {
            int ageDiff = Math.abs(myProfile.getAge() - candidateProfile.getAge());
            if (ageDiff <= MAX_AGE_DIFFERENCE_FOR_BONUS) {
                score += 1;
            }
        }

        return score;
    }

    private boolean equalsIgnoreCaseSafe(String a, String b) {
        return a != null && b != null && a.equalsIgnoreCase(b);
    }

    private boolean hasCommonInterests(String[] a, String[] b) {
        if (a == null || b == null) {
            return false;
        }

        for (String interestA : a) {
            for (String interestB : b) {
                if (interestA != null && interestB != null && interestA.equalsIgnoreCase(interestB)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean equalsIgnoreCaseSafeInterests(String[] a, String[] b) {
        return hasCommonInterests(a, b);
    }

    private record ScoredCandidate(Long userId, int score) {
    }
}


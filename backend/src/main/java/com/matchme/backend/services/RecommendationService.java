package com.matchme.backend.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import com.matchme.backend.models.User;
import com.matchme.backend.GeoUtils;
import com.matchme.backend.models.UserBio;
import com.matchme.backend.models.UserProfile;
import com.matchme.backend.repositories.ConnectionRepository;
import com.matchme.backend.repositories.UserBioRepository;
import com.matchme.backend.repositories.UserProfileRepository;
import com.matchme.backend.repositories.UserRepository;
import com.matchme.backend.config.CurrentUserProvider;

@Service
public class RecommendationService {

    private static final int MAX_RECOMMENDATIONS = 10;

    // Мінімальний скор, нижче якого рекомендація вважається "слабкою"
    // і не повинна показуватись користувачу.
    private static final int MIN_SCORE_THRESHOLD = 2;

    private static final int MAX_AGE_DIFFERENCE_FOR_BONUS = 5;

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserBioRepository userBioRepository;
    private final ConnectionRepository connectionRepository;
    private final CurrentUserProvider currentUserProvider;

    public RecommendationService(UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            UserBioRepository userBioRepository,
            ConnectionRepository connectionRepository,
            CurrentUserProvider currentUserProvider) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userBioRepository = userBioRepository;
        this.connectionRepository = connectionRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @SuppressWarnings("null")
    public List<Long> getRecommendations(Long userId) {
        // Prefer the currently authenticated user id when available
        Long currentUserId = null;
        try {
            currentUserId = currentUserProvider.getCurrentUserId();
        } catch (Exception e) {
            // fallback to provided userId
        }

        Long effectiveUserId = currentUserId != null ? currentUserId : userId;

        User currentUser = userRepository.findById(effectiveUserId).orElse(null);
        if (currentUser == null) {
            return new ArrayList<>();
        }

        if (!isProfileComplete(currentUser)) {
            return new ArrayList<>();
        }

        UserProfile myProfile = userProfileRepository.findById(effectiveUserId)
                .orElse(null);

        UserBio myBio = userBioRepository.findById(effectiveUserId)
                .orElse(null);

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

        List<User> candidates = userRepository.findAll().stream()
                // filter out excluded and the current user
                .filter(u -> !excludedIds.contains(u.getId()))
                .filter(u -> !Objects.equals(u.getId(), effectiveUserId))
                .collect(Collectors.toList());

        return candidates.stream()
                .map(candidate -> {
                    User candidateUser = userRepository.findById(candidate.getId()).orElse(null);
                    UserProfile candidateProfile = userProfileRepository.findById(candidate.getId()).orElse(null);
                    UserBio candidateBio = userBioRepository.findById(candidate.getId()).orElse(null);

                    if (candidateUser == null || !isProfileComplete(candidateUser)) {
                        return null;
                    }

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

                    return new ScoredCandidate(candidate.getId(), score);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(ScoredCandidate::score).reversed())
                .limit(MAX_RECOMMENDATIONS)
                .map(ScoredCandidate::userId)
                .collect(Collectors.toList());
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

    public boolean isProfileComplete(User user) {
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

    private record ScoredCandidate(Long userId, int score) {
    }
}

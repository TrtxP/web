package com.matchme.backend.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

        UserProfile myProfile = userProfileRepository.findById(effectiveUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Профіль користувача не заповнений — рекомендації недоступні"));

        UserBio myBio = userBioRepository.findById(effectiveUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Біографічні дані користувача не заповнені — рекомендації недоступні"));

        List<Long> excludedIds = new ArrayList<>(connectionRepository.findExcludedUserIds(userId));

        List<User> candidates = userRepository.findAll().stream()
                // filter out excluded and the current user
                .filter(u -> !excludedIds.contains(u.getId()))
                .filter(u -> !Objects.equals(u.getId(), effectiveUserId))
                .collect(Collectors.toList());

        
        return candidates.stream()
                .map(candidate -> {
                    UserProfile candidateProfile = userProfileRepository.findById(candidate.getId()).orElse(null);
                    UserBio candidateBio = userBioRepository.findById(candidate.getId()).orElse(null);

                    // Рекомендуємо лише тих, хто теж повністю заповнив профіль/біо
                    if (candidateProfile == null || candidateBio == null) {
                        return null;
                    }

                    // Локейшн сенс-чек: спочатку намагаємось за містом, але дозволяємо
                    // рекомендації в межах певної відстані між містами.
                    if (myProfile.getCity() == null || candidateProfile.getCity() == null) {
                        return null;
                    }

                    if (!myProfile.getCity().equalsIgnoreCase(candidateProfile.getCity())) {
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
            score += 2; // інтереси — найбільш вагомий фактор
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
            score += 2; // те, що людина шукає — теж дуже вагомо
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

    private boolean equalsIgnoreCaseSafeInterests(String[] a, String[] b) {
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

    private record ScoredCandidate(Long userId, int score) {
    }
}

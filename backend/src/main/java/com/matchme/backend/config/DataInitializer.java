package com.matchme.backend.config;

import com.matchme.backend.models.User;
import com.matchme.backend.models.UserBio;
import com.matchme.backend.models.UserProfile;
import com.matchme.backend.repositories.UserBioRepository;
import com.matchme.backend.repositories.UserProfileRepository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.matchme.backend.repositories.UserRepository;

import net.datafaker.Faker;

@Configuration
public class DataInitializer {

    // Фіксований список міст замість faker.address().city(), який на кожного
    // користувача генерує майже унікальне значення. З точним порівнянням
    // міст у RecommendationService це означало б, що майже ніхто ні з ким
    // не збігається за локацією навіть на 100 користувачах. Обмежений список
    // гарантує реальні перетини й дозволяє продемонструвати рекомендації.

    private static final List<String> CITIES = List.of(
            // Major cities and regional centers across Ukraine
            "Kyiv", "Kharkiv", "Odesa", "Dnipro", "Zaporizhzhia", "Lviv",
            "Kryvyi Rih", "Mykolaiv", "Nikopol",
            "Poltava", "Chernihiv", "Cherkasy", "Zhytomyr", "Sumy", "Rivne", "Lutsk",
            "Ivano-Frankivsk", "Ternopil", "Uzhhorod", "Chernivtsi", "Kropyvnytskyi",
            "Bila Tserkva", "Brovary", "Kramatorsk", "Sloviansk", "Konotop",
            "Pavlohrad", "Kamianets-Podilskyi", "Bucha", "Hostomel", "Fastiv",
            "Kovel", "Mukachevo", "Yuzhne", "Sviatohirsk", "Horishni Plavni", "Chervonohrad",
            "Izmail", "Boryspil", "Uman", "Pryluky", "Khmelnitskyi", "Kolomyia",
            "Korosten", "Shepetivka", "Nova Kakhovka", "Shostka", "Novomoskovsk");

    @Bean
    public CommandLineRunner initData(UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            UserBioRepository userBioRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                Faker faker = new Faker(Locale.ENGLISH);
                String commonPassword = passwordEncoder.encode("password123");
                String[] cityOptions = CITIES.toArray(new String[0]);

                for (int i = 0; i < 1000; i++) {

                    User user = new User();
                    String rawName = faker.name().fullName();
                    // Check for honorifics like Mr/Mister or Ms/Miss and derive gender
                    String lower = rawName.toLowerCase(Locale.ENGLISH).trim();
                    String genderFromTitle = null;
                    String cleanName = rawName;
                    if (lower.startsWith("mr ") || lower.startsWith("mister ") || lower.startsWith("mr.")
                            || lower.startsWith("mister.")) {
                        genderFromTitle = "male";
                        cleanName = rawName.replaceFirst("(?i)mr\\.?\\s+|(?i)mister\\.?\\s+", "");
                    } else if (lower.startsWith("ms ") || lower.startsWith("miss ") || lower.startsWith("mrs ")
                            || lower.startsWith("ms.") || lower.startsWith("miss.") || lower.startsWith("mrs.")) {
                        genderFromTitle = "female";
                        cleanName = rawName.replaceFirst("(?i)ms\\.?\\s+|(?i)miss\\.?\\s+|(?i)mrs\\.?\\s+", "");
                    }
                    user.setName(cleanName);
                    user.setEmail(faker.internet().emailAddress());
                    user.setPassword(commonPassword);
                    user.setProfilePictureUrl("https://picsum.photos/200/300?random=" + i);

                    User savedUser = userRepository.save(user);

                    UserProfile userProfile = new UserProfile();
                    userProfile.setUser(savedUser);
                    userProfile.setAboutMe(faker.lorem().sentence(3));
                    userProfile.setCity(faker.options().option(cityOptions));
                    userProfile.setAge(faker.number().numberBetween(18, 50));
                    // use gender from title if detected, otherwise random
                    userProfile.setGender(
                            genderFromTitle != null ? genderFromTitle : faker.options().option("male", "female"));

                    userProfile.setLatitude(faker.number().randomDouble(4, 45, 51));
                    userProfile.setLongitude(faker.number().randomDouble(4, 24, 39));
                    userProfile.setPreferredDistance(faker.number().numberBetween(30, 150));

                    userProfileRepository.save(userProfile);

                    UserBio userBio = new UserBio();
                    userBio.setUser(savedUser);

                    // Виводимо рандомно інтереси від 2 до 5
                    List<String> interests = new ArrayList<>(List.of("Music", "Cinema", "Books", "Sports", "Coding",
                            "Gaming", "Cooking", "Travel", "Art", "Photography"));
                    Collections.shuffle(interests);
                    int randomSize = faker.number().numberBetween(3, 5);
                    String[] selectedInterests = interests.subList(0, randomSize).toArray(new String[0]);
                    userBio.setInterests(selectedInterests);

                    userBio.setFavoriteFood(
                            faker.options().option("Pizza", "Burger", "Sushi", "Pasta", "Salad", "Steak"));
                    userBio.setFavoriteMusic(
                            faker.options().option("Rock", "Pop", "Jazz", "Hip Hop", "Classical", "Electronic"));
                    userBio.setLikesLongWalks(faker.bool().bool());
                    userBio.setLookingFor(faker.options().option("Friends", "Relationships"));

                    userBioRepository.save(userBio);
                }

                System.out.println(">>> Success: Generated 1000 users with profiles and bio!!!");
            }
        };
    }
}

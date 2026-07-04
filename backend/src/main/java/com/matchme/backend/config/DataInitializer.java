package com.matchme.backend.config;

import com.matchme.backend.models.User;
import com.matchme.backend.models.UserBio;
import com.matchme.backend.models.UserProfile;
import com.matchme.backend.repositories.UserBioRepository;
import com.matchme.backend.repositories.UserProfileRepository;

import java.util.Locale;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.matchme.backend.repositories.UserRepository;

import net.datafaker.Faker;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, 
                                    UserProfileRepository userProfileRepository,
                                    UserBioRepository userBioRepository,
                                    PasswordEncoder passwordEncoder) 
    {
        return args -> {
            if (userRepository.count() == 0) {
                Faker faker = new Faker(Locale.ENGLISH);
                String commonPassword = passwordEncoder.encode("password123");

                for (int i = 0; i < 100; i++) {
                    User user = new User();
                    user.setName(faker.name().fullName());
                    user.setEmail(faker.internet().emailAddress());
                    user.setPassword(commonPassword);
                    user.setProfilePictureUrl("https://picsum.photos/200/300?random=" + i);

                    User savedUser = userRepository.save(user);

                    UserProfile userProfile = new UserProfile();
                    userProfile.setUser(savedUser);
                    userProfile.setAboutMe(faker.lorem().sentence(10));
                    userProfile.setCity(faker.address().city());
                    userProfile.setAge(faker.number().numberBetween(18, 50));
                    userProfile.setGender(faker.options().option("male", "female"));

                    userProfileRepository.save(userProfile);

                    UserBio userBio = new UserBio();
                    userBio.setUser(savedUser);
                    userBio.setInterests(faker.options().option("Music", "Cinema", "Books", "Sports", "Coding", "Gaming", "Cooking", "Travel"));
                    userBio.setFavoriteFood(faker.food().dish());
                    userBio.setFavoriteMusic(faker.music().genre());
                    userBio.setLikesLongWalks(faker.bool().bool());
                    userBio.setLookingFor(faker.options().option("Friends", "Relationships"));

                    userBioRepository.save(userBio);
                }

                System.out.println(">>> Success: Generated 100 users with profiles and bio!!!");
            }
        };
    }
}

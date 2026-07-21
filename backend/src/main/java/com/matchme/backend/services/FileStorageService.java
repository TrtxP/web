package com.matchme.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import com.matchme.backend.repositories.UserRepository;
import com.matchme.backend.models.User;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * FileStorageService
 */
@Service
public class FileStorageService {

    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads/profiles}")
    private String uploadDir;

    public FileStorageService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Upload and save user avatar profile picture
     * 
     * @param userId         the user ID
     * @param profilePicture the profile picture file
     * @return the profile picture URL
     * @throws IOException if file operation fails
     */
    public String uploadUserAvatar(Long userId, MultipartFile profilePicture) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // Generate unique filename
        String originalFilename = profilePicture.getOriginalFilename();
        String fileExtension = ".png";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

        // Create upload directory if not exists
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        // Delete old profile picture if exists
        if (user.getProfilePictureUrl() != null && !user.getProfilePictureUrl().isEmpty()) {
            deleteUserAvatar(userId);
        }

        // Save new profile picture
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(profilePicture.getInputStream(), filePath);

        // Update user with new profile picture URL
        String profilePictureUrl = "/" + uploadDir + "/" + uniqueFilename;
        user.setProfilePictureUrl(profilePictureUrl);
        userRepository.save(user);

        return profilePictureUrl;
    }

    /**
     * Delete user avatar profile picture
     * 
     * @param userId the user ID
     * @throws IOException if file operation fails
     */
    public void deleteUserAvatar(Long userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        String url = user.getProfilePictureUrl();

        if (url != null && !url.isEmpty()) {
            // Delete file from disk
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                String profilePicturePath = url.startsWith("/")
                        ? url.substring(1)
                        : url;

                Path filePath = Paths.get(profilePicturePath);
                Files.deleteIfExists(filePath);
            }

            // Update user profile picture URL to null
            user.setProfilePictureUrl(null);
            userRepository.save(user);
        }
    }
}
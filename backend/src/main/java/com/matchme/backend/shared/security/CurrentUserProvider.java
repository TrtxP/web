package com.matchme.backend.shared.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            return Long.parseLong(userDetails.getUsername());
        } else if (principal instanceof String str) {
            return Long.parseLong(str);
        } else if (principal instanceof Long l) {
            return l;
        }

        throw new IllegalStateException("Cannot extract user ID from authentication principal");
    }
}


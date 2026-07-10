package com.matchme.backend.config;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Визначає id поточного автентифікованого користувача з JWT, який поклав
 * у SecurityContext
 * {@code com.matchme.backend.security.JwtAuthenticationFilter}.
 *
 * Метод і далі приймає HttpServletRequest заради сумісності з контролерами,
 * які вже викликають getCurrentUserId(request) — сам параметр більше не
 * використовується, бо userId тепер приходить з перевіреного токена, а не
 * з довільного заголовка.
 */
@Component
public class CurrentUserProvider {

    public Long getCurrentUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Long)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Не авторизовано: відсутній дійсний токен");
        }

        return (Long) authentication.getPrincipal();
    }
}

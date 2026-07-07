package com.matchme.backend.config;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Тимчасовий провайдер поточного користувача (до впровадження JWT). Читає id з
 * заголовка
 * TODO: замінити на реальне визначення користувача з JWT
 * (SecurityContextHolder),
 * коли буде реалізована автентифікація. Зараз використовується заголовок
 * X-User-Id, щоб /me, /recommendations, /connections могли працювати
 * і бути легко протестовані, поки JWT-фільтр не додано.
 */
@Component
public class CurrentUserProvider {

    public Long getCurrentUserId(HttpServletRequest request) {
        String header = request.getHeader("X-User-Id");
        if (header == null || header.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Не авторизовано: відсутній X-User-Id");
        }
        try {
            return Long.parseLong(header);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Некоректний X-User-Id");
        }
    }
}

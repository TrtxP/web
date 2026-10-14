package com.matchme.backend.connection.model;

public enum ConnectionStatus {
    // Запит на з'єднання надіслано, очікує відповіді
    PENDING,
    // Запит прийнято, користувачі з'єднані (можуть переписуватись)
    ACCEPTED,
    // Запит відхилено отримувачем
    DECLINED,
    // Рекомендацію проігноровано (dismiss) — використовується, щоб більше
    // не показувати цього користувача в рекомендаціях
    DISMISSED
}


// Налаштувати базовий URL для Axios або Fetch (http://localhost:8080/api)
// TODO: Реалізувати логіку "Overfetching" згідно з ТЗ MatchMe:
// 1. Спочатку робимо GET запит на /recommendations, щоб отримати масив ID.
// 2. Для кожного ID паралельно викликаємо GET /users/{id} та GET /users/{id}/bio.
// 3. Збираємо це все в один об'єкт профілю для відображення.

export interface UserPreview {
    id: number;
    name: string;
    profilePicture: string;
    bioData: any; // TODO: Описати чіткий інтерфейс біографічних точок (мінімум 5 точок)
}

export const fetchRecommendations = async (): Promise<UserPreview[]> => {
    // TODO: Написати логіку запитів до бекенду Сергія
    return [];
};
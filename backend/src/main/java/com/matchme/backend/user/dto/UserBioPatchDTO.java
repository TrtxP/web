package com.matchme.backend.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO для PATCH /users/{id}/bio та /me/bio.
 *
 * На відміну від entity UserBio (де likesLongWalks — примітивний boolean,
 * що завжди має значення true/false і тому не дозволяє відрізнити
 * "поле не передане в запиті" від "поле явно встановлене в false"),
 * тут likesLongWalks — це Boolean (обгортка). Значення null означає
 * "не чіпати це поле", а не null (true/false) — "встановити саме це значення".
 */
@Getter
@Setter
@NoArgsConstructor
public class UserBioPatchDTO {
    private String[] interests;
    private String favoriteFood;
    private String favoriteMusic;
    private Boolean likesLongWalks;
    private String lookingFor;
}


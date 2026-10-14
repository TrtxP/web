# Match-Me Web Application

Повнофункціональний веб-додаток для знайомств, пошуку друзів та однодумців за спільними інтересами, локацією та життєвими цінностями. 

Проєкт побудований на базі **Spring Boot (Java 21)** на бекенді та **React 19 + TypeScript + Vite + Tailwind CSS** на фронтенді. Архітектура обох частин оптимізована за сучасними модульними принципами (**Feature-Driven / Domain-Driven Packaging** для бекенду та **Feature-Sliced Architecture** для фронтенду).

---

## Зміст

1. [Основні можливості](#основні-можливості)
2. [Технологічний стек](#технологічний-стек)
3. [Оновлена структура проєкту](#оновлена-структура-проєкту)
   - [Загальна структура](#загальна-структура)
   - [Архітектура бекенду (Backend Feature-Driven)](#архітектура-бекенду-backend-feature-driven)
   - [Архітектура фронтенду (Frontend Modular / Feature-Sliced)](#архітектура-фронтенду-frontend-modular--feature-sliced)
4. [Алгоритм рекомендацій](#алгоритм-рекомендацій)
5. [Вимоги до середовища (Prerequisites)](#вимоги-до-середовища-prerequisites)
6. [Конфігурація та налаштування](#конфігурація-та-налаштування)
   - [База даних PostgreSQL (Docker або локально)](#база-даних-postgresql-docker-або-локально)
   - [Налаштування Spring Boot (application.properties)](#налаштування-spring-boot-applicationproperties)
   - [Налаштування Frontend Proxy (vite.config.ts)](#налаштування-frontend-proxy-viteconfigts)
7. [Інструкція із запуску](#інструкція-із-запуску)
   - [Швидкий запуск обох серверів (Оркестрація)](#1-швидкий-запуск-обох-серверів-оркестрація)
   - [Роздільний запуск (Бекенд і Фронтенд окремо)](#2-роздільний-запуск-бекенд-і-фронтенд-окремо)
8. [Тестові дані (Data Seeding)](#тестові-дані-data-seeding)
9. [Огляд API та WebSocket протоколу](#огляд-api-та-websocket-протоколу)
   - [REST Endpoints](#rest-endpoints)
   - [WebSocket & STOMP протокол](#websocket--stomp-протокол)
   - [Тестування через Postman](#тестування-через-postman)

---

## Основні можливості

- **Автентифікація та авторизація**: Stateless безпека на базі JWT (JSON Web Tokens) та BCrypt-хешування паролів.
- **Керування профілем (`/me`)**: Редагування біографії, хобі, улюбленої їжі/музики, віку, статі та намірів знайомства, вибір міста з автокомплітом координат (OpenStreetMap Nominatim API), налаштування радіуса пошуку.
- **Завантаження аватара**: Завантаження та збереження фотографій профілю з валідацією розміру та роздачею статичних файлів.
- **Розумні рекомендації**: Багаторівневий алгоритм сумісності, що враховує мету знайомства, спільні захоплення, відстань (формула гаверсинусів або фільтр тільки за містом), вік та прогулянки.
- **Система зв'язків (Connections)**: Надсилання запитів на знайомство, прийняття або відхилення вхідних заявок, перегляд взаємних контактів та видалення зв'язків.
- **Real-time чат (WebSockets / STOMP / SockJS)**:
  - Миттєвий обмін повідомленнями без перезавантаження.
  - Персональні черги сповіщень (`/user/queue/messages`) та кімнати чатів (`/topic/chat.{id}`).
  - Індикатор набору тексту в реальному часі (`/topic/chat.{id}.typing`).
  - Відстеження online/offline статусу співрозмовників у мережі (`/topic/users.status`).
- **Автоматична генерація демо-бази**: Автоматичне наповнення бази 1000 тестовими користувачами з містами України та правдивими профілями при першому старті.

---

## Технологічний стек

### Backend
- **Мова / Платформа**: Java 21, Spring Boot 4.1.0
- **Безпека**: Spring Security, JJWT (io.jsonwebtoken 0.12.6), BCrypt
- **Робота з даними**: Spring Data JPA, Hibernate, PostgreSQL Driver
- **Real-time зв'язок**: Spring WebSocket, Spring Messaging (STOMP over SockJS)
- **Утиліти**: Lombok, DataFaker (генерація демо-даних), OWASP Java HTML Sanitizer
- **Збірка**: Apache Maven (Maven Wrapper `mvnw` / `mvnw.cmd`)

### Frontend
- **Ядро**: React 19, TypeScript 5+, Vite 8
- **Маршрутизація**: React Router DOM v7
- **Стилізація**: Tailwind CSS v4, PostCSS
- **Мережа & Real-time**: Axios, `@stomp/stompjs`, `sockjs-client`
- **Інструменти якості**: ESLint, TypeScript-ESLint

### Інфраструктура та оркестрація
- **Контейнеризація**: Docker, Docker Compose (PostgreSQL 15 Alpine)
- **Оркестрація запуску**: Node.js `concurrently` + `wait-on`

---

## Оновлена структура проєкту

Проєкт переведено на модульну, слабопов'язану архітектуру.

### Загальна структура

```text
web/
├── backend/                  # Серверний додаток Spring Boot (Java 21)
│   ├── .mvn/                 # Обгортка Maven Wrapper
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/matchme/backend/   # Вихідний код бекенду за доменами
│   │   │   └── resources/                  # Конфігурації (application.properties, .env)
│   │   └── test/                           # Тести Spring Boot
│   ├── uploads/              # Директорія завантажених фотографій користувачів
│   ├── mvnw / mvnw.cmd       # Maven Wrapper скрипти
│   └── pom.xml               # Залежності та конфігурація Maven
├── frontend/                 # Клієнтський додаток React + TypeScript + Vite
│   ├── public/               # Статичні ресурси
│   ├── src/
│   │   ├── app/              # Ініціалізація додатку, роутинг, глобальні провайдери
│   │   ├── entities/         # Доменні бізнес-сутності (User)
│   │   ├── features/         # Ізольовані функціональні модулі (Auth, Chat, Connections тощо)
│   │   ├── pages/            # Сторінки додатку (композиція фіч)
│   │   └── shared/           # Загальні UI-компоненти, HTTP/WS клієнти, утиліти
│   ├── index.html            # Головний HTML-шаблон
│   ├── package.json          # Залежності та скрипти фронтенду
│   ├── tsconfig.json         # Конфігурація TypeScript
│   └── vite.config.ts        # Конфігурація збірки Vite та проксі-сервера
├── docker-compose.yml        # Docker Compose для запуску PostgreSQL
├── package.json              # Спільний запуск через concurrently
└── README.md                 # Головна документація проєкту
```

---

### Архітектура бекенду (Backend Feature-Driven)

Вихідний код бекенду розташований у `backend/src/main/java/com/matchme/backend/` та розбитий за функціональними напрямками (**Feature / Domain Packages**):

```text
com.matchme.backend/
├── BackendApplication.java       # Точка входу в Spring Boot додаток
│
├── auth/                         # Модуль автентифікації
│   ├── controller/               # AuthController (/auth/login, /auth/register)
│   ├── dto/                      # LoginRequestDTO, LoginResponseDTO
│   └── service/                  # AuthService (валідація, реєстрація, генерація токена)
│
├── user/                         # Модуль керування користувачами та профілями
│   ├── controller/               # MeController (/me), UserController (/users),
│   │                             # UserProfileController, UserBioController
│   ├── dto/                      # UserResponseDTO, UserProfileResponseDTO,
│   │                             # UserBioResponseDTO, MyPrivateProfileResponseDTO, UserBioPatchDTO
│   ├── mapper/                   # UserMapper (перетворення сутностей в DTO)
│   ├── model/                    # JPA сутності: User, UserProfile, UserBio
│   ├── repository/               # UserRepository, UserProfileRepository, UserBioRepository
│   └── service/                  # UserService, UserProfileService, UserBioService
│
├── connection/                   # Модуль знайомств та зв'язків між користувачами
│   ├── controller/               # ConnectionController (/connections)
│   ├── dto/                      # ConnectionDTO
│   ├── model/                    # Connection (JPA сутність), ConnectionStatus (PENDING, ACCEPTED, REJECTED)
│   ├── repository/               # ConnectionRepository (запити зв'язків та виключень)
│   └── service/                  # ConnectionService (бізнес-логіка запитів і відповідей)
│
├── recommendation/               # Модуль підбору кандидатів (Matchmaking)
│   ├── controller/               # RecommendationController (/recommendations)
│   └── service/                  # RecommendationService (алгоритм сумісності та скорингу)
│
├── chat/                         # Модуль повідомлень та чатів у реальному часі
│   ├── controller/               # ChatController (REST /chats), ChatWebSocketController (STOMP /app/chat.*)
│   ├── dto/                      # ChatMessageDTO, ChatRequestDTO, ChatSummaryDTO, TypingIndicatorDTO
│   ├── model/                    # Chat, ChatMessage
│   ├── repository/               # ChatRepository, ChatMessageRepository
│   └── service/                  # ChatService (історія, створення чатів, надсилання повідомлень)
│
└── shared/                       # Спільні інфраструктурні компоненти
    ├── config/                   # DataInitializer (генерація 1000 юзерів), SecurityConfig, WebConfig
    ├── dto/                      # IdResponseDTO, UserStatusUpdateDTO
    ├── exception/                # GlobalExceptionHandler (@ControllerAdvice)
    ├── security/                 # JwtService, JwtAuthenticationFilter, JwtChannelInterceptor,
    │                             # CurrentUserProvider, RestAuthenticationEntryPoint
    ├── storage/                  # FileStorageService (завантаження та видалення файлів)
    ├── util/                     # GeoUtils (обчислення відстані за координатами)
    └── websocket/                # WebSocketConfig (STOMP endpoints), WebSocketEventListener (online/offline)
```

---

### Архітектура фронтенду (Frontend Modular / Feature-Sliced)

Фронтенд організовано за принципами модульної архітектури компонентів у `frontend/src/`:

```text
frontend/src/
├── app/                          # Шар додатку
│   ├── providers/                # CurrentUserProvider, CurrentUserContext, useCurrentUser
│   ├── router/                   # AppRouter (декларативні маршрути), ProtectedRoute (захист авторизацією)
│   └── App.tsx                   # Кореневий компонент
│
├── entities/                     # Бізнес-сутності предметної області
│   └── user/                     # Сутність користувача
│       ├── api/                  # userApi.ts (запити профілів, оновлення)
│       ├── hooks/                # useUserStatusSubscription.ts (підписка на онлайн-статуси)
│       ├── model/                # types.ts (інтерфейси User, UserProfile, UserBio)
│       └── ui/                   # FullProfileModal.tsx (модальне вікно перегляду анкети)
│
├── features/                     # Функціональні модулі з власною логікою
│   ├── auth/                     # Вхід та реєстрація
│   │   ├── api/authApi.ts, hooks/useAuthForm.ts, model/types.ts, ui/AuthForm.tsx
│   ├── profile-edit/             # Редагування профілю користувача
│   │   ├── hooks/                # useProfileEditor.ts, useCityAutocomplete.ts
│   │   └── ui/                   # EditProfileModal, ProfilePreferencesSection, ProfileInterestsSection,
│   │                             # ProfileAboutSection, ProfileSidebarCard
│   ├── recommendations/          # Стрічка рекомендацій
│   │   ├── api/recommendationsApi.ts, hooks/useRecommendations.ts, ui/RecommendationCard.tsx
│   ├── connections/              # Керування контактами та запитами
│   │   ├── api/connectionsApi.ts, hooks/useConnections.ts, ui/ConnectedUserCard.tsx, ui/PendingRequestCard.tsx
│   └── chat/                     # Чат реального часу
│       ├── api/chatApi.ts
│       ├── hooks/                # useActiveChatMessages.ts, useChatConversations.ts, useChatTyping.ts
│       └── ui/                   # ChatSidebar.tsx, ChatHeader.tsx, ChatMessageList.tsx, ChatMessageInput.tsx
│
├── pages/                        # Сторінки (збирають фічі докупи)
│   ├── AuthPage.tsx              # /login
│   ├── ProfilePage.tsx           # /profile
│   ├── RecommendationsPage.tsx   # /recommendations
│   ├── ConnectionsPage.tsx       # /connections
│   └── ChatPage.tsx              # /chat
│
└── shared/                       # Повторно використовуваний код
    ├── api/                      # httpClient.ts (налаштований Axios з Bearer токеном), nominatimApi.ts
    ├── types/                    # common.ts
    ├── ui/                       # Layout.tsx (шапка, меню навігації), Spinner.tsx, UserAvatar.tsx
    ├── utils/                    # avatar.ts, date.ts
    └── ws/                       # websocketService.ts (STOMP клієнт), useStompSubscription.ts
```

---

## Алгоритм рекомендацій

Рекомендаційна система розташована в `RecommendationService.java` і працює у два етапи: **жорстка фільтрація (Hard Filtering)** та **багатокритеріальний скоринг (Scoring)**.

### 1. Жорсткі фільтри (Відсікання невідповідних кандидатів)
- **Повнота профілю**: Як поточний користувач, так і кандидат повинні мати заповнені поля: ім'я, стать, вік, місто та мету знайомства (`lookingFor`).
- **Виключення існуючих зв'язків**: Кандидати, з якими вже є зв'язок (`ACCEPTED`), надісланий запит (`PENDING`) або відхилення (`REJECTED`), не потрапляють у видачу.
- **Відповідність цільової статі**:
  - Якщо чоловік шукає стосунки (`Relationships`), алгоритм підбирає жінок.
  - Якщо жінка шукає стосунки (`Relationships`), алгоритм підбирає чоловіків.
  - Якщо користувач шукає дружбу (`Friends`), стать кандидата не обмежується.
- **Спільні прогулянки**: Якщо користувач вказав, що любить довгі прогулянки (`likesLongWalks = true`), кандидат обов'язково повинен також любити прогулянки.
- **Мінімум один спільний інтерес**: Якщо між користувачами немає жодного спільного інтересу, кандидат відсікається.
- **Геолокаційна відповідність**:
  - Якщо активовано прапорець `recommendByCityOnly = true`, пропонуються **виключно** користувачі з того самого міста.
  - Якщо прапорець вимкнено, обчислюється фізична відстань між координатами (широта/довгота) за **формулою гаверсинусів (Haversine formula)**. Кандидат повинен знаходитись у межах `preferredDistance` (за замовчуванням 50 км).

### 2. Формула підрахунку сумісності (Scoring System)

| Критерій | Нараховані бали | Пояснення |
| :--- | :---: | :--- |
| **Спільні інтереси** | **+2** | Наявність хоча б одного або кількох однакових захоплень |
| **Однакова мета пошуку** | **+2** | Збіг значення поля `lookingFor` (наприклад, обидва шукають "Friends" або "Relationships") |
| **Улюблена їжа** | **+1** | Збіг поля `favoriteFood` (наприклад, Sushi, Pizza тощо) |
| **Улюблена музика** | **+1** | Збіг поля `favoriteMusic` (наприклад, Rock, Electronic тощо) |
| **Довгі прогулянки** | **+1** | Збіг уподобань щодо довгих прогулянок |
| **Близький вік** | **+1** | Різниця у віці не перевищує 5 років (`|age1 - age2| <= 5`) |

### 3. Результат
- Відсікаються кандидати з рейтингом нижче порогу: `score < 2`.
- Список сортується за спаданням балів сумісності.
- Повертається до **10 найкращих кандидатів** (`limit(10)`).

---

## Вимоги до середовища (Prerequisites)

Перед запуском переконайтеся, що у вашій системі встановлено:

- **Java JDK 21** або новіша версія
- **Node.js** v18+ (рекомендовано LTS v20 або v22) та менеджер пакетів **npm**
- **Docker & Docker Compose** (найпростіший варіант для запуску PostgreSQL) АБО локально встановлений **PostgreSQL 15+**
- **Git**

---

## Конфігурація та налаштування

### База даних PostgreSQL (Docker або локально)

#### Варіант А: Через Docker Compose (Рекомендовано)

У корені проєкту знаходиться готовий файл `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: match_me_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 0347  
      POSTGRES_DB: matchme_db       
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

> [!NOTE]
> Контейнер експортує внутрішній порт PostgreSQL `5432` на зовнішній порт хоста **`5433`** (щоб уникнути конфліктів із локально встановленим PostgreSQL).

Для запуску бази даних виконайте у терміналі:
```bash
docker compose up -d
```

#### Варіант Б: Локально встановлений PostgreSQL

Створіть користувача та базу даних через `psql`:
```sql
CREATE USER postgres WITH PASSWORD '0347';
CREATE DATABASE matchme_db OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE matchme_db TO postgres;
```

---

### Налаштування Spring Boot (`application.properties`)

Конфігураційний файл бекенду знаходиться за шляхом `backend/src/main/resources/application.properties`. 

Зверніть увагу на порт підключення до БД:
- Якщо ви використовуєте **Docker Compose**: вкажіть порт `5433`:
  ```properties
  spring.datasource.url=jdbc:postgresql://localhost:5433/matchme_db
  ```
- Якщо ви використовуєте **локальний PostgreSQL**: використовуйте стандартний порт `5432`:
  ```properties
  spring.datasource.url=jdbc:postgresql://localhost:5432/matchme_db
  ```

Повний приклад типової конфігурації:
```properties
spring.application.name=backend

# Підключення до БД (вкажіть 5433 для Docker або 5432 для локального Postgres)
spring.datasource.url=jdbc:postgresql://localhost:5433/matchme_db
spring.datasource.username=postgres
spring.datasource.password=0347

# Налаштування Hibernate / JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Ліміти завантаження фотографій (аватарів)
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=5MB
spring.servlet.multipart.resolve-lazily=true

# JWT Конфігурація
matchme.jwt.secret=Jo8UVgPQ80+Iixpa9cJMFR4Kq04DHjim0CIhkGQ6gQE=
matchme.jwt.expiration-ms=86400000
```

---

### Налаштування Frontend Proxy (`vite.config.ts`)

У `frontend/vite.config.ts` налаштовано зворотне проксі (Reverse Proxy), що перенаправляє запити з клієнта на порт бекенду `8080`:
- `/api/*` -> перенаправляється на `http://localhost:8080/*` (із відсіканням префікса `/api`)
- `/ws` -> WebSocket з'єднання проксуються на `ws://localhost:8080/ws`
- `/uploads/*` -> роздача завантажених фотографій напряму з бекенду

---

## Інструкція із запуску

### 1. Швидкий запуск обох серверів (Оркестрація)

У корені проєкту налаштовано єдиний запуск за допомогою `concurrently` та `wait-on`. 
Frontend почне запуск автоматично тільки після того, як бекенд успішно підніме порт `8080`.

#### Крок 1: Клонування репозиторію
```bash
git clone https://gitea.kood.tech/illyacherepanov/web.git
cd web
```

#### Крок 2: Встановлення залежностей
Встановіть залежності оркестратора в корені та залежності фронтенду:
```bash
# Встановлення кореневих пакетів (concurrently, wait-on)
npm install

# Встановлення залежностей клієнта
cd frontend && npm install && cd ..
```

#### Крок 3: Запуск бази даних
```bash
docker compose up -d
```

#### Крок 4: Запуск бекенду та фронтенду однією командою
```bash
npm run dev
```

Після компіляції та старту додатків відкрийте браузер за адресою:
👉 **http://localhost:5173**

---

### 2. Роздільний запуск (Бекенд і Фронтенд окремо)

Якщо вам зручно тримати бекенд і фронтенд у різних вкладках термінала для відлагодження:

#### Термінал 1 (Backend - Spring Boot):
```bash
cd backend

# На Windows (PowerShell або CMD):
.\mvnw.cmd spring-boot:run

# На Linux / macOS:
./mvnw spring-boot:run
```
Бекенд запуститься на порту: `http://localhost:8080`.

#### Термінал 2 (Frontend - React Vite):
```bash
cd frontend
npm install
npm run dev
```
Фронтенд запуститься на порту: `http://localhost:5173`.

---

## Тестові дані (Data Seeding)

У бекенд вбудовано компонент `DataInitializer.java`, що автоматично перевіряє стан бази даних під час кожного запуску.

- Якщо таблиця користувачів порожня (`userRepository.count() == 0`), сервіс автоматично генерує **1000 повноцінних тестових акаунтів** за допомогою бібліотеки `DataFaker`.
- Кожен користувач має:
  - Реальне українське місто (Київ, Львів, Одеса, Харків, Дніпро тощо) з геокоординатами.
  - Заповнений профіль (вік, стать, опис "Про мене", аватар із Picsum).
  - Набір інтересів (Music, Gaming, Coding, Art тощо), уподобання в їжі, музиці та прогулянках.
  - **Пароль для всіх згенерованих користувачів**: `password123`.

Ви можете одразу увійти під будь-яким згенерованим email (побачити їх можна в логах або в БД) або зареєструвати новий власний акаунт через форму на сторінці `/login`.

---

## Огляд API та WebSocket протоколу

### REST Endpoints

Всі публічні запити з фронтенду проходять через префікс `/api`, який Vite транслює на бекенд:

#### 1. Автентифікація (`/auth`)
- `POST /auth/register` — реєстрація нового користувача (створює запис User, повертає JWT токен).
- `POST /auth/login` — авторизація за email та паролем (повертає JWT токен та ID).

#### 2. Особистий кабінет (`/me`) — вимагає Bearer JWT
- `GET /me` — отримання повної приватної інформації поточного користувача.
- `PUT /me` / `PATCH /me` — оновлення базових даних (ім'я тощо).
- `GET /me/profile` — отримання профілю (місто, вік, стать, координати, радіус пошуку).
- `POST /me/profile` / `PATCH /me/profile` — створення або часткове оновлення профілю.
- `GET /me/bio` — отримання біографічних параметрів (інтереси, їжа, музика, прогулянки, мета).
- `PATCH /me/bio` — оновлення інтересів та вподобань.
- `POST /me/profile-picture` — завантаження фотографії аватарки (multipart/form-data, поле `file`).
- `DELETE /me/profile-picture` — видалення поточної аватарки.

#### 3. Рекомендації (`/recommendations`) — вимагає Bearer JWT
- `GET /recommendations` — список ID рекомендованих кандидатів, відсортованих за балом сумісності (якщо профіль не заповнено, повертає статус `403 Forbidden`).
- `DELETE /recommendations/{targetId}` — приховати користувача зі списку рекомендацій (ставиться статус `REJECTED`).

#### 4. Зв'язки та запити (`/connections`) — вимагає Bearer JWT
- `GET /connections` — список ID підтверджених взаємних контактів (`ACCEPTED`).
- `GET /connections/requests` — список вхідних запитів на знайомство (`PENDING`).
- `POST /connections/{targetId}` — надіслати запит на зв'язок користувачу `targetId`.
- `PATCH /connections/{connectionId}/respond?accept=true|false` — прийняти або відхилити вхідний запит.
- `DELETE /connections/{otherUserId}` — розірвати зв'язок або скасувати контакт (автоматично видаляє пов'язаний чат).

#### 5. Чати та листування (`/chats`) — вимагає Bearer JWT
- `GET /chats` — список усіх активних чатів поточного користувача з останніми повідомленнями.
- `POST /chats` — знайти або створити чат зі співрозмовником (`{"participantId": <id>}`).
- `GET /chats/{chatId}/messages?page=0&size=50` — історія повідомлень конкретного чату з пагінацією.

---

### WebSocket & STOMP протокол

Ендпоінт підключення: `ws://localhost:8080/ws` (з підтримкою SockJS).

#### Автентифікація:
Під час відкриття сесії STOMP `CONNECT` передається заголовок:
```text
Authorization: Bearer <ваш_jwt_токен>
```
`JwtChannelInterceptor` перевіряє валідність токена та асоціює з'єднання з `Principal` користувача.

#### Канали підписки (Subscribe):
- `/user/queue/messages` — персональна черга: сюди надходять нові приватні повідомлення для поточного користувача.
- `/topic/chat.{chatId}` — публічний топік відкритого чату для миттєвого відображення нових реплік обом співрозмовникам.
- `/topic/chat.{chatId}.typing` — отримання статусу набору тексту у кімнаті чату.
- `/topic/users.status` — широкомовний канал подій підключення/відключення (`{"userId": 1, "status": "ONLINE" | "OFFLINE"}`).

#### Канали надсилання (Send Destinations):
- `/app/chat.send` — відправити текстове повідомлення:
  ```json
  {
    "chatId": 1,
    "content": "Привіт! Як справи?"
  }
  ```
- `/app/chat.typing` — повідомити співрозмовника про набір тексту:
  ```json
  {
    "chatId": 1,
    "typing": true
  }
  ```

---

### Тестування через Postman

1. **REST запити**:
   - Надішліть `POST http://localhost:8080/auth/login` з JSON тілом:
     ```json
     {
       "email": "user@example.com",
       "password": "password123"
     }
     ```
   - Скопіюйте поле `token` із відповіді.
   - Для наступних запитів додайте заголовок у вкладці **Authorization** -> **Bearer Token** або у **Headers**:
     `Authorization: Bearer <ваш_токен>`.
2. **WebSocket (STOMP)**:
   - Створіть новий запит типу **WebSocket** у Postman.
   - URL: `ws://localhost:8080/ws/websocket`.
   - Надішліть фрейм `CONNECT` з валідним заголовком `Authorization: Bearer <токен>`.
   - Підпишіться (`SUBSCRIBE`) на чергу `/user/queue/messages` або топік `/topic/chat.1`.

---

## Ліцензія та авторство

Розроблено в рамках проєкту Match-Me.  
Розповсюджується під ліцензією ISC.
# Match-Me

Вебзастосунок для знайомств і пошуку друзів за інтересами, містом та відстанню.
Бекенд побудовано на Java/Spring Boot, фронтенд — на React/TypeScript.
Чат використовує GraphQL; профілі, авторизація, рекомендації та з'єднання — REST.

Репозиторій: [TrtxP/web](https://github.com/TrtxP/web).
Детальний опис реалізації: [архітектура GraphQL українською](docs/GRAPHQL_ARCHITECTURE.uk.md).

## Можливості

- Реєстрація та вхід із JWT, BCrypt-хешування паролів.
- Показ і приховування пароля, підказки кнопок, клавіатурний фокус,
  пов'язані підписи полів та ARIA-повідомлення у формах авторизації.
- Редагування власного профілю, біографії, інтересів і фотографії.
- Пошук міста через OpenStreetMap Nominatim, вибір відстані або пошуку лише за містом.
- Рекомендації за інтересами, метою знайомства, локацією та віком.
- Запити на з'єднання, прийняття, відхилення та розрив з'єднань.
- GraphQL-чат: історія з пагінацією, повідомлення, прочитання й індикатор набору.
- Online/offline-події через STOMP/SockJS.
- Генерація 1000 демокористувачів, якщо база порожня і seeding увімкнений.

## Стек

| Частина | Технології |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1.0, Spring MVC, Spring for GraphQL |
| Дані | Spring Data JPA, Hibernate, PostgreSQL |
| Безпека | Spring Security, JJWT 0.12.6, BCrypt, авторизація сервісних методів |
| Події | GraphQL over WebSocket, Spring Messaging/STOMP, транзакційні події |
| Frontend | React 19, TypeScript 6, Vite 8, React Router 7, Tailwind CSS 4 |
| Мережа | Axios, graphql-ws, @stomp/stompjs, sockjs-client |
| Перевірки | JUnit, GraphQlTester, H2, Node.js test runner, ESLint |
| Запуск | Maven Wrapper, npm, concurrently, wait-on, Docker Compose |

Версії Spring for GraphQL та GraphQL Java узгоджуються через BOM Spring Boot.

## Структура

```text
web/
├── backend/
│   ├── src/main/java/com/matchme/backend/
│   │   ├── auth/             # Вхід, реєстрація, JWT
│   │   ├── user/             # Обліковий запис, профіль, біографія
│   │   ├── connection/       # З'єднання та запити
│   │   ├── recommendation/   # Відбір і оцінювання кандидатів
│   │   ├── chat/             # Контролери, сервіси, DTO, mapper, події, репозиторії
│   │   └── shared/           # Security, GraphQL, WebSocket, storage, configuration
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── graphql/chat.graphqls
│   ├── src/test/             # Інтеграційні тести та окремий профіль H2
│   ├── .gitignore
│   ├── mvnw / mvnw.cmd
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── app/              # Провайдери та маршрути
│   │   ├── entities/         # Модель користувача та API профілів
│   │   ├── features/         # auth, chat, connections, recommendations, profile-edit
│   │   ├── pages/            # Композиція сторінок
│   │   └── shared/           # UI, HTTP/GraphQL/STOMP-клієнти, утиліти
│   ├── package.json
│   └── vite.config.ts
├── docs/GRAPHQL_ARCHITECTURE.uk.md
├── docker-compose.yml
├── package.json
└── README.md
```

Локальний `backend/src/main/resources/.env` не входить до репозиторію.

## Швидкий запуск у Windows / PowerShell

Перевірене середовище: JDK 21 і Node.js 24 з npm. Для бази потрібні
Docker Compose або локальний PostgreSQL. Встановлювати Maven окремо не потрібно.

```powershell
git clone https://github.com/TrtxP/web.git
cd web
npm ci
npm --prefix frontend ci
docker compose up -d db
```

Docker публікує PostgreSQL на **localhost:5433**; всередині контейнера — 5432.
Типова адреса у `application.properties` — **localhost:5432**.
Для бази з цього Compose у тому самому терміналі задайте:

```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5433/matchme_db'
npm run dev
```

Облікові дані БД мають збігатися з `docker-compose.yml`. Якщо змінюєте їх,
перед запуском також задайте `SPRING_DATASOURCE_USERNAME` і
`SPRING_DATASOURCE_PASSWORD`.

Кореневий `npm run dev` запускає бекенд і чекає доступності порту 8080
перед запуском Vite. Це перевірка порту, а не повної готовності застосунку.

| Сервіс | Адреса |
| --- | --- |
| React / Vite | http://localhost:5173 |
| Spring Boot | http://localhost:8080 |
| GraphQL HTTP | http://localhost:8080/graphql |
| GraphQL WebSocket | ws://localhost:8080/graphql/ws |
| STOMP/SockJS | http://localhost:8080/ws |

Якщо 5173 зайнятий, Vite може вибрати інший порт. CORS налаштовано для 5173 і 5174.

### Окремий запуск

Перший термінал:

```powershell
cd backend
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5433/matchme_db'
.\mvnw.cmd spring-boot:run
```

Другий термінал з кореня репозиторію:

```powershell
cd frontend
npm run dev
```

Для локальної PostgreSQL на 5432 змінна URL не потрібна, якщо інші параметри
збігаються з конфігурацією. На Linux/macOS бекенд запускається через `./mvnw`;
кореневий сценарій спільного запуску наразі орієнтований на Windows.

## Конфігурація та .env

Spring Boot бере конфігурацію з `application.properties` і змінних середовища.
Наявний код **не завантажує .env автоматично**: збереження файла в resources
саме собою не встановлює змінні процесу Java.

| Змінна процесу | Призначення |
| --- | --- |
| `SPRING_DATASOURCE_URL` | JDBC URL бази |
| `SPRING_DATASOURCE_USERNAME` | Користувач PostgreSQL |
| `SPRING_DATASOURCE_PASSWORD` | Пароль PostgreSQL |
| `MATCHME_JWT_SECRET` | Base64-ключ JWT, щонайменше 32 випадкові байти |
| `MATCHME_SEED_ENABLED` | `false` вимикає генерацію демокористувачів |
| `VITE_API_URL` | Базова адреса API для фронтенду; типово http://localhost:8080 |

Змінні `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` із локального .env
не є автоматичними замінами властивостей Spring. Налаштуйте їх відображення
на наведені змінні через IDE або середовище запуску.
Для Vite можна використати локальний `frontend/.env.local`; значення
`VITE_*` доступні у браузері, тому вони не повинні містити секретів.

### Правила Git

У `backend/.gitignore` правило `.env` ігнорує файли з цим ім'ям у бекенді,
включно з `src/main/resources/.env`. Також ігноруються `target/`,
службові файли IDE та інші артефакти збірки.

Gitignore не припиняє відстеження вже закоміченого файла. Для цього виконано
вказану команду з каталогу, де лежить файл:

```powershell
cd backend/src/main/resources
git rm -r --cached .env
```

Команда прибирає файл з індексу Git і наступного коміту, зберігаючи локальний
файл. Вона не видаляє його з попередньої історії комітів. Якщо файл уже містив
справжні секрети, їх слід замінити; переписування історії цією зміною не виконується.

У репозиторії залишаються демонстраційні значення конфігурації.
Для production задавайте власні секрети поза Git, вимикайте seeding,
використовуйте HTTPS і керовані міграції замість `ddl-auto=update`.

## Архітектура чату

`ChatGraphQlController → ChatService → Repository`.

Контролери REST/STOMP і GraphQL викликають спільний сервіс.
`ChatAccessService` перевіряє участь у чаті. Історія та список діалогів
повертаються як DTO-проєкції; JPA-сутності не є GraphQL-контрактом.

Сервіс зберігає повідомлення у транзакції й публікує `ChatEvent`.
Після commit `ChatEventBroker` доставляє подію GraphQL-підпискам учасників,
а `ChatStompEventListener` підтримує сумісність зі старими клієнтами.
Rollback не спричиняє розсилку.

Клієнт очікує відповідь мутації, об'єднує її з подією за ID,
показує помилки й перечитує останню сторінку після reconnect.

## GraphQL API

Схема: [chat.graphqls](backend/src/main/resources/graphql/chat.graphqls).

| Тип | Операція |
| --- | --- |
| Query | `chats` |
| Query | `chatMessages(chatId, page, size)` |
| Mutation | `openChat(participantId)` |
| Mutation | `sendMessage(input)` |
| Mutation | `markChatRead(chatId)` |
| Mutation | `setChatTyping(chatId, typing)` |
| Subscription | `chatEvents(chatId)` |

HTTP-запит: `POST /graphql`, `Content-Type: application/json`,
`Authorization: Bearer <JWT>`.

```graphql
query History($chatId: ID!) {
  chatMessages(chatId: $chatId, page: 0, size: 30) {
    content { id chatId senderId content sentAt read }
    last
  }
}
```

Змінні: `{ "chatId": "1" }`.

```graphql
mutation Send($input: SendMessageInput!) {
  sendMessage(input: $input) { id chatId senderId content sentAt read }
}
```

Змінні: `{ "input": { "chatId": "1", "content": "Привіт!" } }`.

```graphql
subscription Events($chatId: ID) {
  chatEvents(chatId: $chatId) {
    kind
    chatId
    message { id senderId content sentAt read }
    receipt { readerId }
    typing { userId typing }
  }
}
```

Відсутній або null `chatId` означає особистий потік усіх чатів користувача.
Для WebSocket використовується протокол `graphql-transport-ws` і повідомлення:

```json
{
  "type": "connection_init",
  "payload": { "Authorization": "Bearer <JWT>" }
}
```

JWT перевіряється на ініціалізації, перед операціями і перед доставкою
події підписки. GraphQL errors можуть надходити навіть з HTTP 200.
Очікувані помилки мають classification `BAD_REQUEST`, `UNAUTHORIZED`,
`FORBIDDEN` або `NOT_FOUND`.

Ліміти: повідомлення до 5000 символів; `page` 0..10000, `size` 1..100;
глибина GraphQL-запиту до 12, складність до 200.

## REST і STOMP

| Маршрут | Призначення |
| --- | --- |
| `POST /auth/register`, `POST /auth/login` | Реєстрація та JWT |
| `/me`, `/me/profile`, `/me/bio` | Власний обліковий запис і профіль |
| `POST /me/profile-picture`, `DELETE /me/profile-picture` | Фотографія |
| `GET /users/{id}`, `/users/{id}/profile`, `/users/{id}/bio` | Публічні DTO користувачів |
| `/connections`, `/connections/requests` | З'єднання і вхідні запити |
| `GET /recommendations` | Рекомендовані користувачі |
| `/chats`, `GET /chats/{chatId}/messages` | REST-сумісність чату |
| `GET /uploads/**` | Завантажені фотографії |

Зміни користувачів через `/users/{id}` та профільні підмаршрути потребують
автентифікації й перевірки власника. Пароль не повертається в JSON.

STOMP/SockJS залишається для статусів і подій з'єднань; чат має адаптер сумісності:

- `/topic/users.status` — online/offline;
- `/topic/connections.{userId}` — події з'єднань;
- `/app/chat.send`, `/app/chat.read`, `/app/chat.typing` — старі команди чату;
- `/topic/chat.{id}`, `/topic/chat.{id}.read`, `/topic/chat.{id}.typing` — події чату;
- `/user/queue/messages` — особисті повідомлення.

JWT для STOMP передається в заголовку `Authorization` фрейму CONNECT.
Підписка на чужий чат і пряме надсилання в broker topics блокуються.

## Рекомендації та демодані

Рекомендації потребують заповненого профілю: ім'я, місто, вік, стать і мета.
Алгоритм виключає самого користувача й уже оброблені з'єднання, перевіряє
спільні інтереси, локацію, налаштування прогулянок та цільової статі.
Оцінювання враховує інтереси, їжу, музику, прогулянки, мету й близькість віку.
Повертається до 10 кандидатів з оцінкою не нижче 2.

За замовчуванням `DataInitializer` генерує 1000 користувачів у порожній БД.
Для вимкнення задайте `MATCHME_SEED_ENABLED=false`. Демопароль —
`password123`; демодані призначені для локального ознайомлення.

## Перевірки

```powershell
cd backend
.\mvnw.cmd -B test -Ddebug=false
```

```powershell
cd frontend
npm test
npm run build
npm run lint
```

Тести бекенду використовують профіль `test`, окрему H2-базу, вимкнений
seeding і `open-in-view=false`; робоча PostgreSQL не змінюється.
Вони перевіряють HTTP/WebSocket, JWT, доступ до чатів і профілів, rollback,
конкурентне відкриття, схему та складність запитів.
Клієнтські тести перевіряють GraphQL-відповіді, JWT і перетворення ID.

Кореневий `npm test` наразі є заглушкою; перевірки виконуйте у відповідних каталогах.

## Поточні межі

- Broker працює в пам'яті одного JVM, без durable replay/outbox.
  Для кількох серверів потрібна спільна система доставки.
- Reconnect перечитує останню сторінку, а не всю пропущену історію.
- Пагінація сторінкова, час повідомлень — `LocalDateTime` без часового поясу.
- H2-тести не замінюють перевірку на PostgreSQL; браузерний E2E не автоматизований.
- Multipart-завантаження фотографій залишається REST.
- Деталі, приклади й офіційні джерела:
  [GRAPHQL_ARCHITECTURE.uk.md](docs/GRAPHQL_ARCHITECTURE.uk.md).

## Коміти

Використовується формат `type(scope): description`, наприклад:

```text
feat(chat): add authenticated GraphQL messaging
fix(security): enforce profile ownership
docs: update setup and GraphQL documentation
```

## Авторство та ліцензія

Проєкт Match-Me. У кореневому `package.json` зазначено ліцензію ISC.

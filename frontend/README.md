# Match-Me — frontend

React 19 + TypeScript 6 + Vite 8. Основні інструкції встановлення,
конфігурації БД і запуску: [README проєкту](../README.md).
GraphQL API: [опис архітектури](../docs/GRAPHQL_ARCHITECTURE.uk.md).

## Запуск

Потрібні запущений бекенд на порту 8080 і Node.js 24 з npm.

```powershell
npm ci
npm run dev
```

Vite зазвичай відкривається на http://localhost:5173.

## Команди

| Команда | Призначення |
| --- | --- |
| `npm run dev` | Сервер розробки |
| `npm test` | Перевірка типів тестів і Node.js test runner |
| `npm run build` | TypeScript і production-збірка у dist |
| `npm run lint` | ESLint |
| `npm run preview` | Локальний перегляд production-збірки |

## Конфігурація

`VITE_API_URL` задає базову адресу HTTP API; типово це
`http://localhost:8080`. Її можна встановити в локальному `.env.local`.
Після зміни перезапустіть Vite. Змінні `VITE_*` потрапляють у браузер і не
повинні містити секретів.

GraphQL WebSocket URL формується з базової адреси API і шляху `/graphql/ws`.
Для HTTPS використовується `wss:`. Проксі `/graphql` у `vite.config.ts`
підтримує WebSocket. Проксі `/api` прибирає префікс для HTTP-запитів;
для GraphQL WS через цей префікс додатково потрібне `ws: true`.

## Структура та взаємодія

- `app/` — провайдер користувача, маршрути і захист сторінок.
- `entities/user/` — DTO користувачів, API та профільні компоненти.
- `features/auth/` — вхід і реєстрація, перемикач видимості пароля та доступність форм.
- `features/chat/` — GraphQL-операції, відображення ID, hooks історії та підписок.
- `features/connections/`, `features/recommendations/` — з'єднання та рекомендації.
- `features/profile-edit/` — редактор профілю.
- `pages/` — компонування сторінок.
- `shared/api/` — HTTP і GraphQL-клієнти.
- `shared/ws/` — STOMP/SockJS для статусів та подій з'єднань.
- `shared/ui/` — спільні UI-компоненти.

GraphQL-запити й мутації проходять через Axios/JWT interceptor.
Підписки використовують спільний клієнт `graphql-ws`; токен передається
у `connection_init`. HTTP 200 не гарантує успіх GraphQL:
`GraphQlRequestError` обробляє поле `errors`.

Повідомлення об'єднуються за ID, підписки скасовуються при зміні чату,
після reconnect перечитується остання сторінка історії. Під час logout
закриваються GraphQL- і STOMP-з'єднання.

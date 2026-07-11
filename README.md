# Match-Me Web Application

This repository contains the full-stack source code for the **Match-Me** web application. The project is built using a **Spring Boot** backend and a **Vite + React (TypeScript)** frontend, orchestrated to run concurrently using Node.js tools and exposed to the internet via an ngrok proxy.

---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

* **Java 21+** (or your current JDK version)
* **Maven**
* **Node.js** (LTS version recommended) & **npm**
* **ngrok Agent** (v3.x.x)

* **PostgreSQL** (recommended v12+)
* **Postman** (or another API client) for testing REST endpoints and WebSocket connections

---

## Project Structure

Ensure your root directory has the following structure:

```text
match-me/
├── backend/          # Spring Boot Application (Maven)
├── frontend/         # Vite + React Application
├── package.json      # Root Node.js orchestration config
└── README.md
```

Getting Started
1. Clone the Repository
First, clone the project repository from Gitea using the following command:

git clone [https://gitea.kood.tech/illyacherepanov/web.git](https://gitea.kood.tech/illyacherepanov/web.git)<br>
```
cd web
```

2. Installation
Install the project dependencies (including concurrently for running both servers simultaneously) in the root folder:
<br>
```
npm install
```

3. Running
To run both the backend and frontend development servers simultaneously, execute the following command in your terminal:
<br>
```
npm run dev
```
To expose your frontend via an ngrok proxy so it can be accessed from other devices, open a second terminal and run:
<br>
```
ngrok http 5173
```
First time setting up ngrok?
If you don't have ngrok installed or configured yet, follow these steps:

1. Open PowerShell in Windows 10/11.

2. Install the ngrok agent via Windows Package Manager:
<br>
PowerShell
<br>
```
winget install ngrok.ngrok
```
Restart your terminal or IDE (VS Code) to apply environment changes.

Authenticate your ngrok agent with your personal authtoken:
```
ngrok config add-authtoken <your_auth_token>
```

***Note: The ngrok proxy must be running if you want to test and launch the web application on mobile gadgets such as smartphones and tablets.***

---

## PostgreSQL setup

1. Install PostgreSQL (https://www.postgresql.org/download/) and create a database and user for the application. Example using psql:

```
createuser matchme_user -P    # follow prompts to set password
createdb matchme_db -O matchme_user
```

## Docker setup

If you want to run PostgreSQL in Docker instead of installing it locally, use the project `docker-compose.yml` configuration. The compose file should expose the PostgreSQL host port and map it to the container port, for example:

```
services:
  postgres:
    image: postgres:15
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: matchme_db
      POSTGRES_USER: matchme_user
      POSTGRES_PASSWORD: your_password
```

Start the service with:

```
docker compose up -d
```

Then configure Spring Boot to use the same host port as defined in `docker-compose.yml`. For the example above, use `5432` in the datasource URL.

2. Configure Spring Boot to use the database. In backend/src/main/resources/application.properties (or application.yml) set:

```
spring.datasource.url=jdbc:postgresql://localhost:5432/matchme_db
spring.datasource.username=matchme_user
spring.datasource.password=<your_password>
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

3. Start the backend. Spring Boot will connect to PostgreSQL on startup. Check logs for successful connection.

---

## Testing endpoints and WebSocket with Postman

1. REST endpoints

- Open Postman and create a new Request. Use the backend base URL (default http://localhost:8080) and the appropriate path (for example, /api/auth/login or /api/users).
- Set method (GET/POST/PUT/DELETE), headers (Content-Type: application/json) and body as JSON when required. Send and inspect status, headers, and response JSON.

2. WebSocket (Spring Boot)

- In Postman, create a new WebSocket request (select "WebSocket" tab).
- Use the backend WS URL, for example: ws://localhost:8080/ws (adjust path according to your app's configuration).
- Connect, then send a text message matching your server's expected payload (usually JSON). Watch incoming messages in the Postman Messages panel.

Notes:
- If your Spring Boot app secures endpoints (JWT, sessions), obtain an auth token via REST login and include it in headers (Authorization: Bearer <token>) for REST requests. For WebSocket, include the token according to your socket handshake (e.g., query param ?access_token=... or Sec-WebSocket-Protocol header) depending on server implementation.
- When testing over ngrok, replace localhost with the forwarded ngrok URL (https://xxxx.ngrok.io) and use wss:// for secure WebSocket connections.
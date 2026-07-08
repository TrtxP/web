# Match-Me Web Application

This repository contains the full-stack source code for the **Match-Me** web application. The project is built using a **Spring Boot** backend and a **Vite + React (TypeScript)** frontend, orchestrated to run concurrently using Node.js tools and exposed to the internet via an ngrok proxy.

---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

* **Java 21+** (or your current JDK version)
* **Maven**
* **Node.js** (LTS version recommended) & **npm**
* **ngrok Agent** (v3.x.x)

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
# Match-Me Web Application

This repository contains the full-stack source code for the **Match-Me** web application. The project is built using a **Spring Boot** backend and a **Vite + React (TypeScript)** frontend, orchestrated to run concurrently using Node.js tools and exposed to the internet via an ngrok proxy.

---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
* **Java 17+** (or your current JDK version)
* **Maven**
* **Node.js** (LTS version recommended) & **npm**
* **ngrok Agent** (v3.x.x)

---

## Project Structure
Ensure your root directory has the following structure:
```
match-me/
├── backend/          # Spring Boot Application (Maven)
├── frontend/         # Vite + React Application
├── package.json      # Root Node.js orchestration config
└── README.md
```

---

## Getting Started

### 1. Clone the Repository
First, clone the project repository from Gitea using the following command:

```bash
git clone [https://gitea.kood.tech/illyacherepanov/match-me.git](https://gitea.kood.tech/illyacherepanov/match-me.git)
cd match-me
```

## 2. Installation
Install the project dependencies (including concurrently for running both servers simultaneously) in the root folder:
```
npm install
```

### 3. Running 
---
For running both servers of back-end and front-end parts write a next command in first console in VS Code:
```
npm run dev
```
---
And in second console if you have installed **ngrok.exe** file for running a ngrok proxy write a command:
```
ngrok http 5173
```

If you not just install it with next steps:
1. Open PowerShell in Window 10/11;
2. Write a command: **winget install ngrok.ngrok**;
3. Close PowerShell and open a VS Code IDE;
4. In directory ```<disk directory>:\web>``` write a command: **ngrok config add-authtoken <your authorized token>**;
---

***Note: Ngrok proxy should run yourself if you want to launch a web application in mobile gadgets as smartphones and tablets. ***
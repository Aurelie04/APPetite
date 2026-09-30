# Appétite · Fast-Food & Délices

A modern web app for fast-food restaurants.

| Part       | Stack                                                          | Folder      | URL                    |
|------------|----------------------------------------------------------------|-------------|------------------------|
| Frontend   | React 19, Vite 8, React Router 7, lucide-react                 | `frontend/` | http://localhost:5173  |
| Backend    | Spring Boot 4.1 (Java 17), Spring Security + JWT, Spring Data JPA | `backend/`  | http://localhost:8080  |
| Database   | MySQL 8, database `react_demo` (created automatically)         |             | localhost:3306         |

## Features so far

- Landing page with the Appétite logo blended into an animated colourful background
- Sign in (JWT, "remember me"), forgot password and reset password
- Two account types, each with its own registration page and dashboard:

| Account           | Registers with                                            | Page                   | Dashboard     |
|-------------------|-----------------------------------------------------------|------------------------|---------------|
| Client            | email, password, confirm password                         | `/register`            | `/client` - browse all registered restaurants (search + cuisine filter) |
| Restaurant admin  | your name, restaurant name, email, password, confirm password | `/register/restaurant` | `/restaurant` - edit the restaurant profile, live client preview, getting-started checklist |

Signing in redirects each user to the dashboard for their role; opening the other dashboard redirects back.

## Prerequisites

- Java 17+ (Maven is **not** required, the Maven wrapper `mvnw` is included)
- Node.js 20+
- MySQL 8 running on `localhost:3306`

## 1. Configure the database

The backend connects as `root` with an **empty password** by default. Set your own credentials with
environment variables (recommended) or by editing `backend/src/main/resources/application.properties`.

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-mysql-password"
```

The `react_demo` database and its tables (`users`, `restaurants`, `password_reset_tokens`) are created automatically on first start.

## 2. Start the backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

## 3. Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. In development, Vite proxies `/api` calls to the backend on port 8080.

## Forgot password in development

No mail server is configured yet. When you request a reset link, the backend logs it and (while
`app.password-reset.expose-link=true`) the page shows a **Reset my password** link directly.
Set `EXPOSE_RESET_LINK=false` once real email sending is added.

## API

| Method | Endpoint                    | Auth   | Body                                        |
|--------|-----------------------------|--------|---------------------------------------------|
| POST   | `/api/auth/register/client`     | public | `{ email, password }`                   |
| POST   | `/api/auth/register/restaurant` | public | `{ fullName, restaurantName, email, password }` |
| POST   | `/api/auth/login`           | public | `{ email, password }`                       |
| POST   | `/api/auth/forgot-password` | public | `{ email }`                                 |
| POST   | `/api/auth/reset-password`  | public | `{ token, password }`                       |
| GET    | `/api/users/me`             | Bearer | -                                           |
| GET    | `/api/restaurants`          | Bearer (any role) | - (all restaurants)              |
| GET    | `/api/restaurants/me`       | Bearer (restaurant) | -                              |
| PUT    | `/api/restaurants/me`       | Bearer (restaurant) | `{ name, cuisine?, address?, phone?, description? }` |

## Configuration (environment variables)

| Variable            | Default                    | Purpose                              |
|---------------------|----------------------------|--------------------------------------|
| `DB_HOST` / `DB_PORT` | `localhost` / `3306`     | MySQL server                         |
| `DB_USERNAME`       | `root`                     | MySQL user                           |
| `DB_PASSWORD`       | *(empty)*                  | MySQL password                       |
| `JWT_SECRET`        | random key per start       | Base64 HMAC key, at least 32 bytes (set it so logins survive restarts) |
| `FRONTEND_URL`      | `http://localhost:5173`    | Used to build reset links            |
| `CORS_ORIGINS`      | `http://localhost:5173`    | Comma-separated allowed origins      |
| `EXPOSE_RESET_LINK` | `true`                     | Return reset link in API response    |

## Tests

```powershell
cd backend
.\mvnw.cmd test
```

The integration tests use an in-memory H2 database, so they don't need MySQL.

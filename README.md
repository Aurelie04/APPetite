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

Every page except the landing page has a **back arrow** and a **Home** link at the top. Signed-in users who
open the landing page see a "Go to my dashboard" card instead of the sign-in form.

## Security and validation

The same rules are checked in the browser (instant feedback) and enforced again by the backend.

- **Passwords** must be 8-100 characters with no spaces and contain an uppercase letter, a lowercase letter,
  a number and a special character (for example `Burger@2026`). The sign-up and reset pages show a live
  strength meter with each rule. Passwords are stored as BCrypt hashes (cost 12).
- **Emails** must look like `name@domain.tld` (no spaces, a real top-level domain of 2+ letters).
- **Your name** (restaurant admin): 2-100 letters, spaces, apostrophes, dots or hyphens (accents allowed).
- **Restaurant name**: 2-120 letters, numbers, spaces and `' & . , ! -`.
- **Spring Security**: stateless JWT authentication, sign-in through Spring's `AuthenticationManager`,
  role-based rules (`/api/restaurants/me` is restaurant-only, also enforced with `@PreAuthorize`),
  JSON 401/403 responses, and security headers (CSP, frame denial, no-sniff).
- **Brute-force protection**: after 5 failed sign-ins for the same email, sign-in for that email is refused
  for 15 minutes (HTTP 429). A successful sign-in or password reset clears the counter. The counter is kept
  in memory, so it resets when the backend restarts.

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

Sign-in lockout is tuned in `application.properties` with `app.security.login.max-attempts` (default 5)
and `app.security.login.lock-minutes` (default 15).

## Tests

```powershell
cd backend
.\mvnw.cmd test
```

The integration tests use an in-memory H2 database, so they don't need MySQL.

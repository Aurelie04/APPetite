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
| Client            | email, password, confirm password                         | `/register`            | `/client` - browse restaurants, order, check out and follow orders in `/orders` |
| Restaurant admin  | your name, restaurant name, email, password, confirm password | `/register/restaurant` | `/restaurant` - orders, profile & logo, menu & prices, payments & services |

Signing in redirects each user to the dashboard for their role; opening the other dashboard redirects back.

### Restaurant owner dashboard (`/restaurant`)

Four tabs (the active tab is kept in the URL, e.g. `/restaurant?tab=menu`):

- **Orders** - incoming orders with the client's email, phone, delivery address, note, items, total, and
  payment method/status. The list refreshes every 15 seconds and the tab shows a badge with the number of new
  orders. One-click actions move an order along: *Accept* or *Decline*, then *Start preparing*,
  *Mark as ready* (or *Ready for delivery*), *Out for delivery*, and finally *Delivered*, *Picked up* or *Served*.
- **Profile & logo** - upload a logo (PNG, JPG, WEBP or GIF, max 2 MB, stored in MySQL), name, cuisine,
  address, phone, opening hours, description and the menu currency.
- **Menu & prices** - add, edit, hide or delete **food** and **beverages**, each with a category
  (type of food or drink), a price and an optional description. Hidden items are not shown to clients.
- **Payments & services** - two switches turn **Cash** and **Online** payment on or off, and you can pick
  the exact online methods (card, mobile money, PayPal) and the services you offer (delivery, takeaway,
  dine-in). A summary line shows what clients will be offered at checkout. At least one payment method is
  required; new restaurants start with cash on arrival. Clients can only order once at least one service is on.

A live client preview, a getting-started checklist and a **View my public page** link show the owner exactly
what clients see.

### Client dashboard (`/client`)

Every registered restaurant is listed with its logo, cuisine, starting price, services, payment methods,
number of dishes and drinks, opening hours, address and phone. Clients can search and filter by cuisine,
service (delivery, takeaway, dine-in) and payment (cash on arrival, pay online). Opening a restaurant
(`/restaurants/{id}`) shows its full menu grouped by category with prices, plus all its services and payment
options.

### Ordering and checkout

1. On a restaurant page, clients tap **Add** next to dishes and drinks and adjust quantities with the + / -
   buttons. The cart (one restaurant at a time) is saved in the browser for each account, and the header
   shows a cart button with the item count.
2. **Checkout** (`/checkout`) reloads the menu so prices are current. The client then chooses one of the
   restaurant's own services (delivery needs an address and phone number), one of its accepted payment
   methods (**pay on arrival** in cash, or **pay online now**), and can add a note.
3. **My orders** (`/orders`) shows each order's progress (new, accepted, preparing, ready, out for delivery,
   completed) and refreshes on its own. A client can cancel until the restaurant accepts the order.

The backend recalculates every price from the database, checks that the restaurant accepts the chosen payment
method and service, and limits each client to 5 orders waiting for a restaurant at the same time.

> Online payment is **simulated** (demo mode): no money is charged and the order is marked *Paid*. If the
> restaurant cancels a paid order it is marked *Refunded*. Cash orders are marked *Paid* when completed.
> Plug in a real payment provider (Stripe, PayPal, a mobile money API) before going live.

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
  role-based rules (`/api/restaurants/me/**` is restaurant-only and `/api/orders/**` is client-only, also
  enforced with `@PreAuthorize`; each user only ever sees their own orders),
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

The `react_demo` database and its tables (`users`, `restaurants`, `restaurant_logos`, `menu_items`,
`restaurant_payment_methods`, `restaurant_service_options`, `orders`, `order_items`, `password_reset_tokens`) are created automatically on
first start.

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

Open http://localhost:5173. In development, Vite proxies `/api` calls to the backend on port 8080
(set `API_PROXY_TARGET`, e.g. `http://localhost:8081`, to point it at another backend).

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
| GET    | `/api/restaurants`          | Bearer (any role) | - (all restaurants with options and menu summary) |
| GET    | `/api/restaurants/{id}`     | Bearer (any role) | - (restaurant + available menu items) |
| GET    | `/api/restaurants/{id}/logo` | public | - (image, cached; used by `<img>` tags)     |
| GET    | `/api/restaurants/me`       | Bearer (restaurant) | -                              |
| PUT    | `/api/restaurants/me`       | Bearer (restaurant) | `{ name, cuisine?, address?, phone?, openingHours?, currency?, description? }` |
| PUT    | `/api/restaurants/me/options` | Bearer (restaurant) | `{ paymentMethods: [CASH_ON_ARRIVAL, CARD_ONLINE, MOBILE_MONEY, PAYPAL], serviceOptions: [DELIVERY, TAKEAWAY, DINE_IN] }` |
| POST   | `/api/restaurants/me/logo`  | Bearer (restaurant) | multipart form field `file` (max 2 MB) |
| DELETE | `/api/restaurants/me/logo`  | Bearer (restaurant) | -                              |
| GET    | `/api/restaurants/me/menu`  | Bearer (restaurant) | - (all items, including hidden ones) |
| POST   | `/api/restaurants/me/menu`  | Bearer (restaurant) | `{ kind: FOOD\|BEVERAGE, name, price, category?, description?, available? }` |
| PUT    | `/api/restaurants/me/menu/{itemId}` | Bearer (restaurant) | same as POST                 |
| DELETE | `/api/restaurants/me/menu/{itemId}` | Bearer (restaurant) | -                            |
| POST   | `/api/orders`               | Bearer (client) | `{ restaurantId, items: [{ menuItemId, quantity }], serviceOption, paymentMethod, deliveryAddress?, contactPhone?, note? }` |
| GET    | `/api/orders`               | Bearer (client) | - (my latest 50 orders)            |
| POST   | `/api/orders/{orderId}/cancel` | Bearer (client) | - (only while the order is waiting for the restaurant) |
| GET    | `/api/restaurants/me/orders` | Bearer (restaurant) | - (latest 100 orders with the next allowed statuses) |
| PUT    | `/api/restaurants/me/orders/{orderId}/status` | Bearer (restaurant) | `{ status: ACCEPTED\|PREPARING\|READY\|OUT_FOR_DELIVERY\|COMPLETED\|CANCELLED }` |

Supported currencies: EUR, USD, GBP, CHF, CAD, ZAR, NGN, GHS, KES, MAD, XOF, XAF.

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

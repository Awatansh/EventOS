# EventOS — Next-Generation Event Booking Platform

EventOS is a production-grade, full-stack event management and booking platform engineered for high concurrency, security, and an exceptional user experience. It demonstrates industry-standard backend architecture, real-time capabilities, and a polished, accessible frontend.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-event--os--Live-6366f1?style=for-the-badge&logo=vercel)](https://event-os-frontend.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend%20API-event--os--backend-0ea5e9?style=for-the-badge&logo=express)](https://event-os-backend.vercel.app/api/health)

> [!NOTE]
> **Cold Start:** The database runs on a serverless Neon PostgreSQL instance. The very first request after a period of inactivity may take 3–5 seconds to wake the compute instance. All subsequent requests execute instantly.

---

## 🏗️ Architecture & Database Schema

EventOS uses a decoupled Client-Server architecture communicating over REST and WebSockets. The backend follows a strict **Controller → Service → Repository** pattern to keep business logic portable and testable.

```mermaid
erDiagram
    EVENT_OS_USERS ||--o{ EVENT_OS_BOOKINGS : "makes"
    EVENT_OS_USERS ||--o{ EVENT_OS_REFRESH_TOKENS : "owns"
    EVENT_OS_EVENTS ||--o{ EVENT_OS_BOOKINGS : "receives"

    EVENT_OS_USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar name
        varchar role "user | admin"
        timestamp created_at
    }

    EVENT_OS_EVENTS {
        uuid id PK
        varchar title
        text description
        timestamp date
        varchar venue
        varchar category
        int total_seats
        int available_seats "CHECK >= 0"
        varchar image_url
        timestamp created_at
    }

    EVENT_OS_BOOKINGS {
        uuid id PK
        uuid user_id FK
        uuid event_id FK
        int number_of_seats
        varchar status "booked | cancelled"
        timestamp created_at
    }

    EVENT_OS_REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        timestamp expires_at
        timestamp created_at
    }

    EVENT_OS_NEWSLETTER_SUBSCRIBERS {
        uuid id PK
        varchar email UK
        timestamp subscribed_at
    }
```

---

## 🛠️ Project Setup

### Step 1: Configure Environment Variables

Copy the example files to create your local `.env` files:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend (optional — defaults work for local dev)
cp frontend/.env.example frontend/.env.local
```

Open `backend/.env` and fill in all required values. Key values you must set:

- `DATABASE_URL` — Your PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — From the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `GOOGLE_REDIRECT_URL` — `http://localhost:3000/api/v1/auth/google/callback` for local dev

> [ IMP ]
> In the Google Cloud Console, add `http://localhost:3000/api/v1/auth/google/callback` under **Authorized redirect URIs**.

### Step 2: Choose Your Database Setup

#### Method A: Serverless Postgres (Neon — Recommended)

1. Paste your Neon connection string into `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_xxxxxxxx@ep-xxxx-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
2. Run the automated setup script:

   **Mac/Linux:**

   ```bash
   ./setup-live.sh
   ```

   **Windows:**

   ```powershell
   .\setup-live.ps1
   ```

#### Method B: Local Docker

1. Set `DATABASE_URL`:
   ```env
   DATABASE_URL=postgres://eventos_user:eventos_password@localhost:5433/eventbooking
   ```
2. Run:

   **Mac/Linux:**

   ```bash
   ./setup-docker.sh
   ```

   **Windows:**

   ```powershell
   .\setup-docker.ps1
   ```

#### Method C: Local PostgreSQL (pgAdmin / psql)

1. Create a database named `eventbooking`.
2. Set `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:YourPassword123!@localhost:5432/eventbooking
   ```
3. Run `.\setup-live.ps1` (Windows) or `./setup-live.sh` (Mac/Linux).

---

### 🎉 Next Steps

## _Once the setup scripts complete successfully, open [http://localhost:5173](http://localhost:5173) in your browser to view the application!_

### 🔑 Default Test Credentials

The database is seeded with the following accounts for testing:

**Admin Account:**
- **Email:** `admin@eventos.dev`
- **Password:** `Admin@1234`

**Regular User Account:**
- **Email:** `alice@example.com`
- **Password:** `User@1234`

---

## **🔐 Environment Variables Reference**

### Backend — `backend/.env`

| Variable                    | Category       | Description                                             |
| --------------------------- | -------------- | ------------------------------------------------------- |
| `NODE_ENV`                  | Infrastructure | `development` or `production`                           |
| `PORT`                      | Infrastructure | Express server port (default: `3000`)                   |
| `DATABASE_URL`              | Infrastructure | PostgreSQL connection string                            |
| `JWT_ACCESS_SECRET`         | Security       | Secret for signing access tokens — min 32 chars         |
| `JWT_REFRESH_SECRET`        | Security       | Secret for signing refresh tokens — min 32 chars        |
| `BCRYPT_ROUNDS`             | Security       | bcrypt cost factor (recommended: `12`)                  |
| `CORS_ORIGIN`               | Security       | Allowed frontend origin (e.g., `http://localhost:5173`) |
| `RATE_LIMIT_WINDOW_MS`      | Rate Limiting  | Time window in ms (e.g., `900000` = 15 min)             |
| `RATE_LIMIT_MAX`            | Rate Limiting  | Max requests per IP per window (e.g., `100`)            |
| `SEAT_LOCK_TIMEOUT_SECONDS` | Concurrency    | Row-level lock timeout before a transaction aborts      |
| `GOOGLE_CLIENT_ID`          | OAuth          | Google OAuth 2.0 Client ID                              |
| `GOOGLE_CLIENT_SECRET`      | OAuth          | Google OAuth 2.0 Client Secret                          |
| `GOOGLE_REDIRECT_URL`       | OAuth          | Callback URL → must match Google Cloud Console exactly  |

### Frontend — `frontend/.env.local`

| Variable            | Required | Description                                               |
| ------------------- | :------: | --------------------------------------------------------- |
| `VITE_API_BASE_URL` | Optional | Override API base URL. Defaults to `/api/v1` (Vite proxy) |

> [!TIP]
> `VITE_GOOGLE_CLIENT_ID` is **no longer needed**. The OAuth flow is fully server-driven — no Google scripts are loaded in the browser.

---

## 📡 API Reference

```
Local      → http://localhost:3000/api/v1
Production → https://event-os-backend.vercel.app/api/v1
```

**Legend:** `—` Public &nbsp;|&nbsp; `🔒` Requires Bearer token &nbsp;|&nbsp; `🔒 Admin` Requires admin role

### Authentication `/auth`

| Method | Endpoint                |  Auth  | Description                                                |
| :----: | ----------------------- | :----: | ---------------------------------------------------------- |
| `POST` | `/auth/register`        |   —    | Create account with name, email, password                  |
| `POST` | `/auth/login`           |   —    | Validate credentials → sets `HttpOnly` refresh cookie      |
| `POST` | `/auth/refresh`         | Cookie | Rotate refresh token → returns new access token + user     |
| `POST` | `/auth/logout`          |   🔒   | Revoke active refresh token                                |
| `GET`  | `/auth/me`              |   🔒   | Return authenticated user's profile                        |
| `GET`  | `/auth/google`          |   —    | Return Google OAuth redirect URL                           |
| `GET`  | `/auth/google/callback` |   —    | Server-side token exchange → login or redirect to register |

### Events `/events`

| Method | Endpoint | Auth | Description |
|:---:|---|:---:|---|
| `GET` | `/events` | — | Paginated event list (`?limit=N`, `?status=published`) |
| `GET` | `/events/categories` | — | Get all unique published categories for dynamic filtering |
| `GET` | `/events/:id` | — | Full details for a single event |
| `POST` | `/events` | 🔒 Admin | Create a new event |
| `PATCH` | `/events/:id` | 🔒 Admin | Update event details |

### Bookings `/bookings`

| Method | Endpoint                | Auth | Description                                                      |
| :----: | ----------------------- | :--: | ---------------------------------------------------------------- |
| `POST` | `/bookings`             |  🔒  | Reserve seats via row-level locking (`eventId`, `numberOfSeats`) |
| `GET`  | `/bookings/my-bookings` |  🔒  | Booking history with full event metadata                         |
| `POST` | `/bookings/:id/cancel`  |  🔒  | Cancel booking → releases seats back to inventory                |

### Admin `/admin`

| Method | Endpoint       |   Auth   | Description                             |
| :----: | -------------- | :------: | --------------------------------------- |
| `GET`  | `/admin/stats` | 🔒 Admin | Revenue, bookings, and capacity metrics |

### Newsletter `/newsletter`

| Method | Endpoint                | Auth | Description                            |
| :----: | ----------------------- | :--: | -------------------------------------- |
| `POST` | `/newsletter/subscribe` |  —   | Subscribe an email to platform updates |

---

## 🧠 Key Engineering Decisions

### 1. Concurrency Control via PostgreSQL Row-Level Locking

In high-traffic booking systems, preventing double-booking is critical. EventOS uses `SELECT ... FOR UPDATE` inside an explicit SQL transaction. When two users attempt to book the last seat simultaneously, the database engine serializes the transactions — the second transaction waits for the first to commit, then re-reads the (now 0) inventory and correctly fails with a 409 Conflict. Application-level locks were explicitly avoided as they don't survive horizontal scaling.

### 2. Dual-Token JWT Session Architecture

- **Access Token** (15-min JWT, in-memory only): Sent as a `Bearer` header. Short-lived to limit XSS exposure.
- **Refresh Token** (7-day opaque string, `HttpOnly` cookie): Never accessible to JavaScript. Stored in the database as a SHA-256 hash. Rotated on every refresh (token rotation). Vercel's Reverse Proxy makes the backend appear first-party, so the `HttpOnly` cookie is accepted by all browsers without cross-origin cookie restrictions.

### 3. Server-Driven OAuth & Cross-Origin Cookie Strategy

A common failure point in modern web apps is third-party authentication failing due to strict browser privacy controls (like Safari ITP or Chrome's third-party cookie phase-out). Client-side SDKs that rely on cross-site scripts and cookies from `accounts.google.com` frequently break. EventOS solves this using a **Server-Driven OAuth 2.0 flow combined with a Reverse Proxy**:

1. **No Third-Party Scripts**: The React frontend does not load any Google SDKs. When a user clicks "Continue with Google", React simply fetches the OAuth URL from the Express backend and redirects the browser.
2. **Server-Side Handshake**: The Google callback (`/api/v1/auth/google/callback`) is handled entirely by the Express backend, which securely exchanges the code for the user's profile and auto-registers them if necessary.
3. **First-Party Cookies via Reverse Proxy**: In production, the React app (`event-os-frontend.vercel.app`) and the Express API (`event-os-backend.vercel.app`) are distinct domains. The Vercel `vercel.json` utilizes a **reverse proxy rewrite rule**:
   ```json
   {
     "source": "/api/v1/:path*",
     "destination": "https://event-os-backend.vercel.app/api/v1/:path*"
   }
   ```
   Because the frontend proxy forwards the request, the browser perceives the backend as **same-origin**. The backend sets the `HttpOnly` refresh token cookie, and the browser accepts it as a first-party cookie, entirely bypassing cross-site cookie restrictions.

```text
[React Client] ──(Redirect)──> [Google Auth] ──(Redirect)──> [Express Callback] ──(Set-Cookie)──> [React App]
```

### 5. Isolated Newsletter Schema

The `event_os_newsletter_subscribers` table is completely independent of `event_os_users`. Anonymous visitors can subscribe without creating an account, and the marketing pipeline can scale without coupling to authentication.

### 6. Seat Quantity Model

Users book a _quantity_ of seats, not specific numbered seats (e.g., Row A, Seat 12). This dramatically simplifies the booking schema, eliminates seat-map locking edge cases, and supports 100% of general-admission use cases with higher throughput.

---

## ✨ Additional Features

1. **Visual Ticket Receipts & QR Codes** — My Bookings renders a styled "ticket" component with auto-generated QR codes, giving users a tangible, printable receipt.
2. **Real-Time Seat Updates (Socket.io)** — When any user books a seat, all active sessions instantly see the available count decrease — no page refresh needed.
3. **Light / Dark Mode** — Zero-flicker theme engine using CSS Custom Properties and `localStorage`. No expensive JS re-renders.
4. **Admin Analytics Dashboard** — Recharts-powered revenue and capacity charts, visible only to `admin` role users.
5. **Interactive Filtering** — Dynamic date, category, and status filters on the events discovery page.
6. **SVG Illustrations** — All illustrations are native SVGs embedded directly in React components. They scale infinitely and respond to CSS dark-mode variables.
7. **Vitest Test Suite** — Integration and unit tests covering the critical booking concurrency path.
8. **Automated Setup Scripts** — `setup-live.sh/ps1` and `setup-docker.sh/ps1` get any developer running in under a minute.
9. **Rate Limiting** — Per-IP rate limiting with a stricter sub-limiter on all `/auth` endpoints.
10. **Fail-Fast Validation** — Zod schemas intercept every request before it reaches the service layer, eliminating undefined behavior and mass-assignment vulnerabilities.
11. **Debounced Search** — The `useDebounce` hook prevents API spamming by waiting 200ms after the user stops typing before querying the database.
12. **Dynamic Filter Aggregation** — The `GET /api/v1/events/categories` endpoint aggregates all unique categories currently published in the database, making the frontend filter dropdown fully dynamic and future-proof.

---

## 🏗️ Assumptions

1. **Single Venue Model** — Each event maps to exactly one venue. Multi-venue events are out of scope.
2. **Email-Verified Google Accounts** — Google-authenticated users are treated as email-verified by default.
3. **General Admission** — Users book a quantity of seats; specific seat numbers/positions are not tracked.
4. **Booking Idempotency** — Cancelling an already-cancelled booking is handled gracefully without errors.
5. **Database** — PostgreSQL 15+ is assumed. The `FOR UPDATE` row-locking and `ON CONFLICT` syntax are PostgreSQL-specific.

---

## 🚀 Future Roadmap & Improvements

While EventOS is built to enterprise standards, the following upgrades would elevate it to a massive global scale:

### Architecture
- **Cloud Storage & CDN** — Currently, images are managed via external URLs. A massive upgrade would be integrating a free-tier service like **Cloudinary** or **Supabase Storage**. They provide generous limits, excellent developer APIs for direct browser uploads, and global CDNs to serve event banners lightning fast.
- **Redis Caching** — Cache the homepage and `/categories` endpoints for near-zero latency and reduced database load.
- **Search Engine** — Integrate Meilisearch or Elasticsearch for typo-tolerant (fuzzy) search matching.
- **Background Job Queue** — Offload heavy tasks (PDF generation, email sending, seat-lock timeouts) to a queue like BullMQ to keep the main API blazing fast.

### Features
- **Payment Gateway** — Integrate Stripe Checkout and Webhooks to process real monetary transactions.
- **Visual Seat Mapping** — Upgrade from general admission to an interactive SVG seat map allowing users to select specific individual seats (e.g., Row A, Seat 12).
- **Automated Waitlists** — Allow users to join a waitlist for sold-out events, with automatic notifications or temporary holds if tickets become available due to cancellations.

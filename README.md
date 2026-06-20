# EventOS - Next Generation Event Booking Platform

EventOS is a highly scalable, full-stack event management and booking platform. It was built with a strong focus on **code quality**, **maintainability**, **high concurrency**, and an **exceptional user experience**.

[🔥 Live Demo](https://#) *(Link to be added)*

> [!NOTE]  
> **Cold Start Disclaimer:** The database runs on a serverless Neon PostgreSQL instance. If the platform has been inactive for a while, the very first request may take up to 3-4 seconds to wake up the database compute instance. All subsequent requests will execute instantly.

---

## 🏗️ Architecture & Database Schema

The core database uses PostgreSQL. Below is the Entity-Relationship (ER) diagram representing the schema design, demonstrating a clear separation of concerns, robust referential integrity, and dedicated models for my advanced features (like Newsletter Subscriptions).

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "makes"
    EVENTS ||--o{ BOOKINGS : "receives"
    
    USERS {
        uuid id PK
        string email
        string password
        string first_name
        string last_name
        enum role "USER | ADMIN"
    }
    
    EVENTS {
        uuid id PK
        string name
        string description
        timestamp date
        string venue
        int total_seats
        int available_seats
    }
    
    BOOKINGS {
        uuid id PK
        uuid user_id FK
        uuid event_id FK
        int number_of_seats
        enum status "CONFIRMED | CANCELLED"
    }
    
    NEWSLETTER_SUBSCRIBERS {
        uuid id PK
        string email
        timestamp subscribed_at
    }
```

---

## 🛠️ Project Setup

I have provided automated setup scripts for both Mac/Linux and Windows to get you running in under a minute. 

### Step 1: Configure Environment Variables
You must set up your environment variables before running any scripts.

Copy the example files to create your local `.env` files:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

**Note:** Open the new `.env` files and add your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if you want the Google OAuth login flow to work.

### Step 2: Choose Your Database Setup Method

You can run EventOS using a modern Serverless Postgres provider (Method A), a local Docker container (Method B), or a standard Local PostgreSQL App like pgAdmin/Windows (Method C).

#### Method A: Serverless Postgres (Neon / Supabase / AWS)
This is the fastest method. Neon gives you a direct connection string.
1. Open `backend/.env` and paste your exact URL from Neon into `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_xxxxxxxx@ep-xxxx-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   *(Paste it exactly as Neon gives it to you. Do not worry if you see a node SSL warning in the console, it is a harmless library deprecation notice).*
2. Run the automated Live setup script (installs dependencies, runs migrations, seeds data, and starts both servers):

   **Mac/Linux:**
   ```bash
   ./setup-live.sh
   ```
   **Windows:**
   ```powershell
   .\setup-live.ps1
   ```

#### Method B: Local Docker Database
This method spins up a local Postgres instance using `docker-compose`.
1. Open `backend/.env` and paste the standard local Docker URL:
   ```env
   DATABASE_URL=postgres://eventos_user:eventos_password@localhost:5433/eventbooking
   ```
2. Run the automated Docker setup script:

   **Mac/Linux:**
   ```bash
   ./setup-docker.sh
   ```
   **Windows:**
   ```powershell
   .\setup-docker.ps1
   ```

#### Method C: Local PostgreSQL (Windows App / pgAdmin)
If you already have PostgreSQL installed locally on your Windows or Mac machine:
1. Create a database named `eventbooking` in pgAdmin or via psql.
2. Open `backend/.env` and set `DATABASE_URL` to your local postgres credentials (default port is usually 5432):
   ```env
   DATABASE_URL=postgresql://postgres:YourPassword123!@localhost:5432/eventbooking
   ```
3. Run the setup scripts (you can use the Live script, as it skips starting Docker):

   **Windows:**
   ```powershell
   .\setup-live.ps1
   ```

*(Once the scripts finish, navigate to `http://localhost:5173` in your browser!)*

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `NODE_ENV` | Typically `development` or `production`. |
| `PORT` | The port the backend server runs on (e.g., `3000`). |
| `DATABASE_URL` | Your PostgreSQL connection string. |
| `JWT_ACCESS_SECRET` | A secure, random string (min 32 chars) for signing access tokens. |
| `JWT_REFRESH_SECRET` | A secure, random string (min 32 chars) for signing refresh tokens. |
| `BCRYPT_ROUNDS` | Salt rounds for password hashing (e.g., `12`). |
| `CORS_ORIGIN` | The frontend URL allowed to make requests (e.g., `http://localhost:5173`). |
| `RATE_LIMIT_WINDOW_MS` | Time window for rate limiting in milliseconds (e.g., `900000` for 15 mins). |
| `RATE_LIMIT_MAX` | Max requests per IP per window (e.g., `100`). |
| `GOOGLE_CLIENT_ID` | Your Google OAuth 2.0 Client ID (optional). |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth 2.0 Client Secret (optional). |
| `GOOGLE_REDIRECT_URL` | Your Google OAuth Callback URL (optional). |
| `SEAT_LOCK_TIMEOUT_SECONDS` | Time in seconds before an unpaid seat lock expires (e.g., `1`). |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | The backend API URL (e.g., `http://localhost:3000/api/v1`). |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth 2.0 Client ID for the frontend SDK (optional). |

---

## 📡 API Documentation

### Base URL: `http://localhost:3000/api/v1`

### 1. Authentication
- `POST /auth/register`: Register a new user (`email`, `password`, `firstName`, `lastName`).
- `POST /auth/login`: Authenticate and receive `accessToken` and `refreshToken`.
- `POST /auth/refresh`: Obtain a new access token using a valid refresh token.
- `GET /auth/google` & `GET /auth/google/callback`: Endpoints for the Google OAuth2.0 flow.

### 2. Events
- `GET /events`: Fetch a paginated list of events. Supports `?limit=` and `?status=`.
- `GET /events/:id`: Fetch detailed information for a specific event by its ID.

### 3. Bookings (Protected)
- `POST /bookings`: Create a new booking. Requires `{ "eventId": "uuid", "numberOfSeats": 2 }`.
- `GET /bookings/my-bookings`: Retrieve all bookings made by the authenticated user.
- `POST /bookings/:id/cancel`: Cancel an existing booking and release the seats back into the event pool.

### 4. Newsletter
- `POST /newsletter/subscribe`: Subscribe an email to the promotional newsletter.

### 5. Admin (Restricted to `ADMIN` role)
- `GET /admin/stats`: Retrieves platform-wide statistics for the Admin Dashboard (revenue, bookings, etc).

---

## 🧠 Architectural & Design Decisions

To ensure EventOS is scalable, maintainable, and robust, several key architectural decisions were made. **Every decision was driven by the goal of writing production-quality code that mirrors industry best practices:**

1. **Concurrency Control (PostgreSQL Row-Level Locking)** 
   - **Reasoning**: In any high-traffic booking system, preventing "double-booking" is critical. I explicitly chose to use database row-level locking (`SELECT ... FOR UPDATE`) inside a transaction rather than application-level locks. This guarantees that even if hundreds of users attempt to book the exact same final seat simultaneously, the database engine queues the transactions sequentially, eliminating race conditions at the lowest level.
2. **Seat Quantity vs. Specific Seat Mapping**
   - **Reasoning**: I made the decision that users book a *quantity* of seats rather than picking specific numbered seats (e.g., Row A, Seat 12). This significantly simplifies the database schema and booking flow for general admission events, allowing for much higher throughput and faster checkout times without complex seat-locking timeouts.
3. **Dedicated Admin & RBAC Database Schema**
   - **Reasoning**: Rather than spinning up a separate application for administrators, I integrated a `role` ENUM (`USER`, `ADMIN`) directly into the PostgreSQL `event_os_users` table. This allows the system to share authentication logic while protecting sensitive data through robust Role-Based Access Control (RBAC) middleware on the backend.
4. **Isolated Newsletter Subscription Schema**
   - **Reasoning**: I built a dedicated `event_os_newsletter_subscribers` table that operates independently of the `event_os_users` table. This decision was made because visitors might want to subscribe to updates *without* creating a full account. Decoupling this allows marketing efforts to scale without polluting the core user authentication tables.
5. **Relational Booking History Design**
   - **Reasoning**: The `event_os_bookings` table uses strict foreign keys referencing `event_os_users(id)` and `event_os_events(id)`. This relational design ensures absolute data integrity. When a user requests their booking history, the backend can execute highly efficient SQL `JOIN` queries to fetch all related event metadata in a single network trip, rather than relying on the frontend to stitch the data together.
6. **Error Handling Standardization & Zero Data Leakage**
   - **Reasoning**: To ensure absolute consistency for API consumers and absolute security, the system uses a strict global error middleware. Every error is mapped to a unified shape (`{"message": "Human-readable explanation"}`) and specific HTTP codes. Furthermore, the handler is meticulously designed to *never* leak stack traces, raw database logs, or unformatted SQL errors to the frontend, preventing malicious actors from mapping the internal database schema.

---

## ✨ Additional Enhancements

EventOS was engineered to go beyond the baseline assignment requirements. I proactively built the following enhancements to showcase my focus on engineering excellence and user experience:

1. **Visual Ticket Generation & Printouts**
   - The "My Bookings" dashboard doesn't just list data; it features a custom UI component that renders a visual "Ticket". Users have a tangible, formatted receipt of their booking that they can theoretically print or screenshot, vastly improving the end-user experience.
2. **Real-Time WebSockets (Socket.io) vs Static Applications**
   - **The Edge:** Unlike traditional static applications where users must manually refresh the page to see inventory changes (often leading to frustration when seats appear available but aren't), EventOS ensures the UI is a live, exact reflection of the database state. If User A books a ticket, User B doesn't know until they refresh in a static app. EventOS eliminates this blind spot.
   - I integrated `Socket.io` on both the Express backend and React frontend. When a seat is booked by anyone, the backend emits a `seatUpdate` event. The "Available Seats" counter decrements instantly on all active clients without requiring a page refresh. This mimics how top-tier ticketing platforms (like Ticketmaster) operate, creating urgency and making the platform feel truly "alive."
3. **Global Light/Dark Mode Theming Engine**
   - I built a custom `<ThemeProvider>` context that manages the UI state using `localStorage` and the `window.matchMedia` API. It leverages a `[data-theme="dark"]` attribute on the `<html>` element to target CSS variables globally. This allows for highly performant, instantaneous theme switching without expensive React re-renders.
4. **Admin Dashboard with Real-Time Analytics & Logs**
   - Admins get access to custom, restricted dashboards featuring real-time revenue and capacity charts (powered by Recharts). I also included customizability and administrative logs, allowing platform owners to monitor the health and performance of their events in real-time.
5. **Interactive Date Picking & Filtering**
   - The event discovery page includes an interactive date picker and dynamic filtering system. This allows users to effortlessly sift through large volumes of events by date or status, rather than scrolling endlessly through a static list.
6. **Performance via Vector Graphics (SVG)**
   - To optimize load times, all complex illustrations were built using native SVGs embedded directly into the React components instead of relying on heavy raster images (PNG/JPG). SVGs scale infinitely without pixelation and their colors are dynamically targeted by the Dark Mode CSS variables.
7. **Automated Testing Suite (Vitest)**
   - The backend includes highly efficient integration and unit tests written with Vitest. Notably, it includes a robust Concurrency Integration Test that successfully simulates users firing simultaneous bookings for the exact same seats, explicitly verifying that the Row-Level Locking prevents race conditions and strictly rejects the subsequent requests with a 409 Conflict.
8. **Production-Ready Vercel Deployment Architecture**
   - The platform is pre-configured for a modern, split Vercel deployment. It includes a frontend Reverse Proxy (`vercel.json` rewrites) to guarantee cross-domain `HttpOnly` JWT cookies work flawlessly without triggering third-party cookie blockers, and a customized serverless entry point for the Express backend.

---

## 🏗️ Assumptions

During the development of EventOS, the following assumptions were made to scope the project appropriately while maintaining a production-ready standard:

1. **Event Scope**: I assume a **Single Venue Model**. Unless explicitly modeled otherwise, each event occurs at a single venue, and venue capacities map exactly 1:1 with `total_seats`.
2. **Security & Verification**: Users logging in via Google OAuth are implicitly treated as email-verified. JWT access tokens are deliberately short-lived (e.g., 15 minutes) for security, relying on longer-lived Refresh tokens to maintain active sessions without forcing the user to log back in constantly.
3. **Operations & Infrastructure**: The database is assumed to be either standard PostgreSQL via Docker (for local dev) or a serverless PostgreSQL provider like Neon. Neon-specific configurations (like `sslmode=require`) are supported natively by my connection string parser in `db.ts`.
4. **Idempotency**: Booking cancellations are treated as idempotent operations. If a user tries to cancel an already cancelled booking, the system handles it gracefully without errors.

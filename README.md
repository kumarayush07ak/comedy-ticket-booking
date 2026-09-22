# Comedy Event Ticket Booking Platform

A production-style full-stack comedy event ticket booking platform built with **FastAPI, PostgreSQL, Redis, React, and Vite**.

The system supports two roles:

- **ADMIN** — manages cities, venues, seats, events, cancellations, dashboard analytics, and QR ticket scanning.
- **CUSTOMER** — registers, verifies email, browses events, reserves seats, books tickets, makes simulated payments, views tickets, receives notifications, and cancels bookings.

---

## 1. Project Overview

The Comedy Event Ticket Booking Platform is designed to demonstrate a real-world ticket booking workflow with:

- Secure authentication
- Email verification
- Event management
- Venue and physical seat management
- Temporary seat reservations
- PostgreSQL transaction safety
- Redis locking and TTL-based reservations
- Booking and simulated payment processing
- Digital tickets with QR codes
- Admin QR scanning
- Booking and event cancellation
- Refund handling
- Notifications
- Background workers
- Admin analytics dashboard
- API documentation
- Docker-based infrastructure

The architecture is designed to avoid double booking and maintain PostgreSQL as the primary source of truth.

---

## 2. Features

### Authentication

- Customer registration
- Admin authentication
- JWT access tokens
- Password hashing using Argon2
- Email verification
- Protected routes
- Role-based authorization
- Active/inactive account handling

### Event Management

- Create cities
- Create venues
- Configure physical seat layouts
- Create comedy events
- Browse upcoming events
- View event details
- View event seats
- Cancel events

### Booking

- Select seats
- Temporarily hold seats
- Reservation expiration
- Booking creation
- Simulated payment
- Booking confirmation
- Ticket generation
- Booking cancellation

### Ticketing

- Unique ticket number
- Secure QR token
- Ticket status
- QR scanner
- Admin-only ticket scanning
- Used-ticket protection

### Notifications

- Booking confirmation
- Booking cancellation
- Event cancellation
- Reservation expiration
- Event reminders
- Unread notification count
- Mark notification as read

### Admin

- Dashboard analytics
- Customer count
- City count
- Venue count
- Upcoming event count
- Booking count
- Revenue
- Available seats
- Tickets scanned
- QR ticket scanner

---

## 3. User Roles

The platform intentionally supports only two roles.

### ADMIN

The administrator can:

- Create cities
- Create venues
- Create physical seat layouts
- Create events
- Cancel events
- View dashboard analytics
- Scan tickets

The system does not create separate organizer or host accounts.

External comedy organizers are represented through event information maintained by the administrator.

### CUSTOMER

Customers can:

- Register
- Verify email
- Login
- Browse events
- View event details
- Select seats
- Hold seats
- Create bookings
- Make simulated payments
- View tickets
- Display QR codes
- Cancel bookings
- View notifications

---

## 4. Technology Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Redis
- Pydantic
- Pydantic Settings
- JWT
- Argon2
- SMTP

### Frontend

- React
- Vite
- Axios
- React Router
- QRCode React
- HTML5 QR Code

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL 17
- Redis 7

---

## 5. System Architecture

The system follows a layered architecture.

```text
                 ┌─────────────────────┐
                 │      React UI       │
                 │      Vite App       │
                 └──────────┬──────────┘
                            │
                            │ HTTP / JSON
                            ▼
                 ┌─────────────────────┐
                 │       FastAPI       │
                 │      REST API       │
                 └──────────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │PostgreSQL│   │  Redis   │   │  SMTP    │
       │ Source   │   │ Holds /  │   │  Email   │
       │ of Truth │   │ Streams  │   │          │
       └──────────┘   └──────────┘   └──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Background Workers  │
                 │ Notifications       │
                 │ Reminders           │
                 │ Reservation Cleanup │
                 └─────────────────────┘
```

PostgreSQL is the permanent source of truth.

Redis is used for temporary state and fast operations such as:

- Seat holds
- TTL expiration
- Notification streams
- Caching
- Idempotency
- Rate limiting

---

## 6. Project Structure

```text
comedy-ticket-booking/
│
├── backend/
│   ├── app/
│   │   ├── dependencies/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── worker/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 7. Authentication

Authentication uses JWT access tokens.

### Registration

A customer provides:

- Name
- Email
- Password

The password is hashed before being stored.

The account initially has:

```text
email_verified = false
```

A verification token is generated and sent by email.

### Login

Login requires:

1. Valid email
2. Valid password
3. Active account
4. Verified email

Unverified customers cannot login.

### Password Security

Passwords are never stored as plain text.

Argon2 is used for password hashing.

### JWT

After successful login, the backend returns a bearer token.

Frontend stores the access token and sends it using:

```text
Authorization: Bearer <token>
```

---

## 8. Email Verification

Email verification prevents users from logging in before confirming ownership of their email address.

### Flow

```text
Customer Registration
        │
        ▼
Generate Secure Token
        │
        ▼
Hash Token
        │
        ▼
Store Hash + Expiry
        │
        ▼
Send Verification Email
        │
        ▼
Customer Clicks Link
        │
        ▼
Backend Verifies Token
        │
        ▼
email_verified = true
        │
        ▼
Customer Can Login
```

The raw verification token is not stored in the database.

The database stores only its SHA-256 hash.

Verification tokens also have an expiration time.

A verification token can only be consumed once.

---

## 9. Event Management

Admins can create comedy events.

An event contains information such as:

- Event name
- Description
- City
- Venue
- Event date
- Start time
- End time
- Ticket price
- Status

Customers can browse available events and view event details.

Events are linked to venues and physical seats.

Event cancellation is an admin-only operation.

---

## 10. Venue and Seat Management

The system models physical seating.

An admin can:

1. Create a city
2. Create a venue
3. Create physical seats
4. Create an event
5. Attach seats to the event

Seats have identifiers such as:

```text
A1
A2
A3
B1
B2
B3
```

For every event, corresponding event-seat records track the booking state.

Typical event-seat states include:

```text
AVAILABLE
HELD
BOOKED
```

This allows the same physical venue to be reused for multiple events.

---

## 11. Redis Seat Reservation

Temporary reservations are implemented using Redis.

When a customer selects a seat:

```text
reservation:hold:event:{event_id}:seat:{seat_id}
```

is created in Redis.

The key contains a TTL.

Example:

```text
reservation:hold:event:1:seat:10
```

Redis `SET NX` is used so that only one customer can acquire the temporary hold.

The reservation also stores metadata containing information such as:

- Reservation ID
- User ID
- Event ID
- Seat IDs
- Expiration information

When the TTL expires, a background worker releases the PostgreSQL event seats.

---

## 12. Concurrency Protection

Seat booking must protect against two customers attempting to reserve the same seat simultaneously.

The system uses multiple layers of protection.

### Redis

Redis `SET NX` provides atomic temporary seat acquisition.

### PostgreSQL

PostgreSQL row-level locking is used when changing event-seat state.

Conceptually:

```text
SELECT ... FOR UPDATE
```

locks the relevant rows.

### Transaction

The database updates occur inside a transaction.

This protects against:

- Double booking
- Race conditions
- Partial updates
- Invalid seat state transitions

PostgreSQL remains the final source of truth.

---

## 13. Booking System

The booking flow is:

```text
Browse Event
     │
     ▼
Select Seats
     │
     ▼
Create Temporary Hold
     │
     ▼
Create Booking
     │
     ▼
Payment
     │
     ▼
Booking CONFIRMED
     │
     ▼
Seats BOOKED
     │
     ▼
Ticket Generated
     │
     ▼
Notification Published
```

A booking contains:

- Customer
- Event
- Booking items
- Total amount
- Status
- Creation time
- Update time

Booking statuses include states such as:

```text
PENDING
CONFIRMED
CANCELLED
EXPIRED
```

Only the appropriate state transitions are allowed.

---

## 14. Payment System

The project uses simulated payments rather than a real payment gateway.

The payment API receives a booking ID.

The backend:

1. Verifies booking ownership
2. Locks the booking
3. Checks current booking status
4. Checks idempotency
5. Generates a simulated transaction ID
6. Marks payment as successful
7. Confirms the booking
8. Marks seats as BOOKED
9. Generates the ticket
10. Publishes a notification

Payment operations are designed to be idempotent.

Repeated payment requests should not create multiple successful payment records or duplicate tickets.

---

## 15. Digital Tickets

After successful payment, a digital ticket is generated.

A ticket contains:

- Ticket ID
- Booking ID
- Ticket number
- Secure QR token
- Ticket status
- Generated timestamp

The QR token does not expose sensitive customer information.

A QR code is generated by the frontend from the ticket token.

The ticket can be opened from the customer dashboard.

---

## 16. QR Code Scanner

Admins can scan customer tickets.

The scanner supports:

- Camera-based scanning
- Manual QR token fallback

The frontend uses HTML5 QR Code functionality.

The backend validates:

1. Ticket exists
2. Ticket is active
3. QR token matches
4. Ticket has not already been used

A successful scan changes:

```text
ACTIVE → USED
```

A second scan is rejected.

Only ADMIN users can access the scanner endpoint.

---

## 17. Booking Cancellation

Customers can cancel their own confirmed bookings.

Endpoint:

```text
POST /cancellations/bookings/{booking_id}
```

The backend verifies ownership before cancellation.

The cancellation process updates the booking and related seat/payment state according to the cancellation rules.

A cancellation notification is published through Redis.

The customer dashboard provides a cancellation action for eligible bookings.

---

## 18. Event Cancellation

Only administrators can cancel events.

Endpoint:

```text
POST /event-cancellations/{event_id}
```

When an event is cancelled:

- Event status is updated
- Applicable bookings are cancelled
- Associated payments are refunded according to the simulated payment rules
- Seats are released appropriately
- Customers receive notifications

Event cancellation notifications are processed through the notification stream.

---

## 19. Notifications

Notifications are stored in PostgreSQL.

The system uses Redis Streams as the asynchronous communication layer.

Example notification types:

```text
BOOKING_CONFIRMED
BOOKING_CANCELLED
EVENT_CANCELLED
RESERVATION_EXPIRED
EVENT_REMINDER
```

Notification flow:

```text
Application Service
       │
       ▼
Redis Stream
       │
       ▼
Notification Worker
       │
       ▼
PostgreSQL
       │
       ▼
Frontend
```

Customers can:

- View notifications
- See unread count
- Mark notifications as read

---

## 20. Background Workers

The system includes background workers.

### Notification Worker

Consumes Redis notification stream messages and persists notifications to PostgreSQL.

Run with:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.notification_worker
```

### Event Reminder Worker

Checks upcoming events and publishes reminder notifications.

Run with:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.event_reminder_worker
```

### Reservation Cleanup Worker

Finds expired reservations and releases held seats.

Run with:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.reservation_cleanup_worker
```

Each worker is intended to run as a separate process.

---

## 21. Admin Dashboard

The admin dashboard provides system-level statistics.

The dashboard includes:

- Total customers
- Total cities
- Total venues
- Upcoming events
- Total bookings
- Confirmed bookings
- Revenue
- Available seats
- Tickets scanned

Endpoint:

```text
GET /admin/dashboard
```

Only administrators can access this endpoint.

The frontend displays these values using dashboard cards and visual sections.

---

## 22. API Documentation

FastAPI automatically provides interactive API documentation.

Start the backend:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

Alternative documentation:

```text
http://127.0.0.1:8000/redoc
```

The Swagger interface can be used to inspect and test API endpoints.

---

## 23. Database and Migrations

PostgreSQL is the main persistent database.

Alembic manages database schema migrations.

Current migration history includes the initial schema and subsequent changes for:

- Event date
- Event time
- Email verification

Run migrations with:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && alembic upgrade head
```

Check migration status:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && alembic current
```

View migration history:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && alembic history
```

Avoid blindly generating migrations.

Before creating a new migration, inspect the generated migration and verify that it contains only the intended schema changes.

---

## 24. Environment Configuration

Backend environment variables are stored in:

```text
backend/.env
```

Example configuration:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/comedy_ticket
REDIS_URL=redis://127.0.0.1:6379/0

FRONTEND_BASE_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@example.com

EMAIL_VERIFICATION_EXPIRE_MINUTES=30
```

JWT-related secrets should also be configured through environment variables.

Never commit real secrets to Git.

Never place:

- SMTP passwords
- JWT secrets
- Database production passwords
- API keys

inside source code.

---

## 25. Docker Setup

Docker Compose runs the infrastructure services.

Start PostgreSQL and Redis:

```cmd
cd C:\Users\ak967\comedy-ticket-booking && docker compose up -d
```

Check containers:

```cmd
cd C:\Users\ak967\comedy-ticket-booking && docker compose ps
```

Expected infrastructure:

```text
comedy-ticket-postgres
comedy-ticket-redis
```

PostgreSQL:

```text
postgres:17
Port: 5432
Database: comedy_ticket
```

Redis:

```text
redis:7
Port: 6379
```

Stop containers:

```cmd
cd C:\Users\ak967\comedy-ticket-booking && docker compose down
```

Stop containers and remove volumes:

```cmd
cd C:\Users\ak967\comedy-ticket-booking && docker compose down -v
```

The second command deletes the PostgreSQL and Redis Docker volumes, so it should only be used when intentionally resetting local data.

---

## 26. Backend Setup

Open a Windows CMD terminal.

Navigate to backend:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend
```

Create virtual environment if necessary:

```cmd
python -m venv venv
```

Activate:

```cmd
venv\Scripts\activate
```

Install dependencies:

```cmd
pip install -r requirements.txt
```

Run migrations:

```cmd
alembic upgrade head
```

Start FastAPI:

```cmd
python -m uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

## 27. Frontend Setup

Navigate to the frontend:

```cmd
cd C:\Users\ak967\comedy-ticket-booking\frontend
```

Install packages:

```cmd
npm install
```

Start the development server:

```cmd
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Create a production build:

```cmd
npm run build
```

Preview the production build:

```cmd
npm run preview
```

---

## 28. Running the Complete System

The recommended local startup order is:

### Terminal 1 — Infrastructure

```cmd
cd C:\Users\ak967\comedy-ticket-booking && docker compose up -d
```

### Terminal 2 — Backend

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload
```

### Terminal 3 — Notification Worker

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.notification_worker
```

### Terminal 4 — Event Reminder Worker

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.event_reminder_worker
```

### Terminal 5 — Reservation Cleanup Worker

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.reservation_cleanup_worker
```

### Terminal 6 — Frontend

```cmd
cd C:\Users\ak967\comedy-ticket-booking\frontend && npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## 29. Testing Checklist

The following areas should be tested before final submission.

### Authentication

- Customer registration
- Duplicate email rejection
- Password validation
- Email verification
- Expired verification token
- Consumed verification token
- Login before verification
- Login after verification
- Invalid password
- Invalid JWT
- Admin login
- Customer/admin authorization

### Event Management

- Create city
- Create venue
- Create seats
- Create event
- Browse events
- View event details
- View event seats

### Reservation

- Select available seat
- Hold seat
- Duplicate hold
- Hold expiration
- Release expired seat
- Different customer cannot acquire held seat

### Booking

- Create booking
- Booking ownership
- Invalid event
- Invalid seat
- Invalid reservation
- Booking status transitions

### Payment

- Successful payment
- Repeated payment request
- Invalid booking
- Unauthorized booking
- Ticket generation
- Notification generation

### Ticket

- View ticket
- QR token
- First scan
- Second scan rejection
- Non-admin scanner rejection

### Cancellation

- Customer booking cancellation
- Unauthorized cancellation
- Event cancellation
- Payment refund handling
- Cancellation notification

### Notifications

- Booking notification
- Cancellation notification
- Event cancellation notification
- Reservation expiration notification
- Event reminder
- Unread count
- Mark as read

### Admin Dashboard

- Statistics load
- Admin-only protection
- Revenue
- Booking counts
- Ticket scan counts

### Frontend

- Customer dashboard
- Admin dashboard
- Event browsing
- Seat selection
- Booking flow
- Payment flow
- Ticket page
- QR scanner
- Notifications
- Error messages
- Loading states

---

## 30. Final Acceptance Flow

The complete system should support the following end-to-end scenario.

### Step 1 — Admin

Login as administrator.

### Step 2 — City

Create:

```text
Delhi
```

### Step 3 — Venue

Create a comedy venue in Delhi.

### Step 4 — Seat Layout

Create physical seats.

Example:

```text
A1 A2 A3 A4 A5
B1 B2 B3 B4 B5
C1 C2 C3 C4 C5
```

### Step 5 — Event

Create a comedy event using the venue and seats.

### Step 6 — Customer

Register a customer.

### Step 7 — Email

Customer receives verification email.

### Step 8 — Verification

Customer clicks the verification link.

### Step 9 — Login

Customer logs into the application.

### Step 10 — Browse

Customer opens the event.

### Step 11 — Select Seats

Customer selects seats.

### Step 12 — Temporary Hold

Seats become temporarily held.

### Step 13 — Booking

Customer creates booking.

### Step 14 — Payment

Customer completes simulated payment.

### Step 15 — Confirmation

Booking becomes confirmed.

### Step 16 — Ticket

Digital ticket is generated.

### Step 17 — QR

Customer displays the QR code.

### Step 18 — Notification

Customer receives booking confirmation notification.

### Step 19 — Admin Scan

Admin scans the QR code.

Ticket becomes:

```text
USED
```

### Step 20 — Second Scan

A second scan is rejected.

### Step 21 — Cancellation

Customer cancellation can be tested for an eligible booking.

### Step 22 — Event Cancellation

Admin can cancel an event and trigger applicable refunds and notifications.

### Step 23 — Expiration

An uncompleted reservation expires and its seats become available again.

### Step 24 — Reminder

Upcoming event reminders are generated by the reminder worker.

---

## 31. Security

The application includes several security mechanisms.

### Passwords

Passwords are hashed using Argon2.

### JWT

Protected endpoints require a valid JWT bearer token.

### Role Authorization

Admin endpoints require:

```text
ADMIN
```

Customer endpoints require:

```text
CUSTOMER
```

### Email Verification

Customers must verify their email before login.

### Verification Tokens

Only hashed verification tokens are stored.

### Ticket QR Tokens

QR tokens are generated using secure random values.

Sensitive information is not encoded directly into the QR token.

### Ownership Checks

Customers cannot access another customer's bookings or tickets.

### Database Locking

Row-level locking protects booking operations.

### Redis Atomicity

Redis `SET NX` prevents multiple customers from acquiring the same temporary seat hold.

### Secrets

Sensitive configuration belongs in environment variables.

---

## 32. Project Status

The project implements the major functionality required by the specification.

### Backend

- Authentication
- JWT
- Argon2 password hashing
- Email verification
- Cities
- Venues
- Seats
- Events
- Reservations
- Booking
- Payments
- Tickets
- QR scanning
- Booking cancellation
- Event cancellation
- Notifications
- Background workers
- Admin dashboard

### Frontend

- Authentication pages
- Registration
- Email verification
- Customer dashboard
- Event browsing
- Event details
- Seat selection
- Booking flow
- Payment flow
- Ticket display
- QR code
- Admin dashboard
- Admin scanner
- Notifications
- Cancellation actions

### Infrastructure

- PostgreSQL 17
- Redis 7
- Docker Compose
- Alembic migrations

---

## 33. Quick Start

### 1. Start Docker services

```cmd
cd C:\Users\ak967\comedy-ticket-booking && docker compose up -d
```

### 2. Start backend

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload
```

### 3. Start notification worker

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.notification_worker
```

### 4. Start reminder worker

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.event_reminder_worker
```

### 5. Start reservation cleanup worker

```cmd
cd C:\Users\ak967\comedy-ticket-booking\backend && venv\Scripts\activate && python -m app.worker.reservation_cleanup_worker
```

### 6. Start frontend

```cmd
cd C:\Users\ak967\comedy-ticket-booking\frontend && npm run dev
```

### 7. Open the application

```text
http://localhost:5173
```

### 8. Open API documentation

```text
http://127.0.0.1:8000/docs
```

---

## License

This project is developed as a B.Tech portfolio/project implementation.

You may modify and extend it for educational and portfolio purposes.

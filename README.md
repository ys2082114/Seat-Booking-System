# Smart Seat Booking System 🪑

A MERN stack seat booking system with batch rotation, floater seats, time-gated rules, and holiday management.

---

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd seat-booking-system
```

### 2. Setup & run the Backend
```bash
cd server
npm install
cp .env.example .env      # Then edit .env with your values
npm run seed              # Creates 50 seats, 3 users, holidays (run once)
npm run dev               # Starts server on http://localhost:5000
```

### 3. Setup & run the Frontend (new terminal)
```bash
cd client
npm install
npm run dev               # Starts UI on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### Sample Credentials (after seeding)
| Email | Password | Batch |
|---|---|---|
| alice@example.com | password123 | A |
| bob@example.com | password123 | B |
| carol@example.com | password123 | A |

---

## Features

- 🔐 **JWT Authentication** — register / login with batch assignment
- 🪑 **Seat Grid** — visual 50-seat weekly grid with colour-coded availability
- ⚡ **Quick Book** — one-click modal to book a seat for the next working day
- 📋 **My Bookings** — see and release all your upcoming bookings in one panel
- 📊 **Occupancy Bar** — per-day seat fill % shown as a live progress bar
- 🗓️ **Holiday Manager** — add / remove holidays that block bookings for everyone
- 🔄 **Batch Rotation** — automatic seat eligibility rules that flip each week

---

## How the Rules Work

### Seat Types
| Seat Numbers | Type |
|---|---|
| 1 – 40 | Designated |
| 41 – 50 | Floater |

### Batch Rotation Schedule
Week type is derived from the **ISO week number** of the date being booked:
- **Odd ISO week** → WEEK_1
- **Even ISO week** → WEEK_2

| Batch | WEEK_1 | WEEK_2 |
|---|---|---|
| **A** | Mon, Tue, Wed | Thu, Fri |
| **B** | Thu, Fri | Mon, Tue, Wed |

### Seat Eligibility
- **Designated seats** → only bookable on your batch's *designated days*
- **Floater seats** → only bookable on your batch's *non-designated days*

### Time Gate
- Bookings are **only allowed after 3:00 PM IST**
- You can only book for the **next working day**

### Other Rules
- Weekends (Sat/Sun) are always blocked
- Holidays (manageable via the UI) are blocked
- No double-booking: each seat can only be booked once per date
- Users can only release their own bookings

---

## API Endpoints

| Method | URL | Description |
|---|---|---|
| POST | `/auth/register` | Register (name, email, password, batch) |
| POST | `/auth/login` | Login → returns JWT |
| GET | `/seats` | All 50 seats |
| GET | `/bookings?week=YYYY-WW` | Bookings for an ISO week |
| POST | `/bookings` | Book a seat (runs policy engine) |
| DELETE | `/bookings/:id` | Release own booking |
| GET | `/my-bookings` | All your bookings (upcoming) |
| GET | `/holidays` | List all holidays |
| POST | `/holidays` | Add a holiday `{ date, reason }` |
| DELETE | `/holidays/:id` | Remove a holiday |

All endpoints except `/auth/*` require a `Bearer <JWT>` token.

---

## Project Structure

```
seat-booking-system/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Seat.js
│   │   ├── Booking.js
│   │   └── Holiday.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── seats.js
│   │   ├── bookings.js
│   │   ├── holidays.js
│   │   └── myBookings.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── policyEngine.js
│   ├── seed.js
│   ├── index.js
│   ├── .env.example
│   └── .env           ← not committed (git-ignored)
├── client/
│   └── src/
│       ├── pages/
│       │   ├── AuthPage.jsx
│       │   └── BookingPage.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── SeatGrid.jsx
│       │   ├── MyBookings.jsx
│       │   ├── OccupancyBar.jsx
│       │   ├── QuickBookModal.jsx
│       │   └── HolidayManager.jsx
│       └── services/
│           └── api.js
└── README.md
```

---

## UI Color Guide

| Color | Meaning |
|---|---|
| 🟢 Green | Designated seat — available for your batch today |
| 🟡 Yellow | Floater seat — available on your non-designated day |
| 🔵 Blue | Booked by you (click to release) |
| ⚫ Grey | Booked by someone else |
| 🔴 Red | Blocked (wrong day, weekend, holiday, wrong batch) |

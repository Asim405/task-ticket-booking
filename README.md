# Ticket Booking App

A full-stack Ticket Booking application using Node.js, Express, MySQL, and a cinema-inspired dark UI.

## Features

- Express server on port `3001`
- MySQL database `ticket_db`
- `tickets` table with sample ticket bookings
- API route: `GET /tickets`
- Frontend served from `public/`
- Card-based ticket display
- Real-time event search
- QR code per ticket

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure MySQL is running.

3. If your MySQL credentials are different, set environment variables before starting:
   - `DB_HOST` (default: `localhost`)
   - `DB_USER` (default: `root`)
   - `DB_PASSWORD` (default: empty)
   - `DB_PORT` (default: `3306`)

   Example:
   ```bash
   set DB_USER=root
   set DB_PASSWORD=your_password
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open the frontend in your browser:
   ```
   http://localhost:3001
   ```

## React Native Mobile App

A React Native Expo app is available in `mobile-app/`. It connects to the same backend API and displays ticket cards, a search field, and a QR scanner.

1. Change into the mobile folder:
   ```bash
   cd mobile-app
   ```

2. Install mobile dependencies:
   ```bash
   npm install
   ```

3. Start the Expo app:
   ```bash
   npm start
   ```

4. If you run the app on an Android emulator, use the backend API base URL:
   ```js
   http://10.0.2.2:3001
   ```

5. If you use Expo on a real device, replace the base URL in `mobile-app/App.js` with your machine IP:
   ```js
   http://<YOUR_COMPUTER_IP>:3001
   ```

## How it works

- The server creates the `ticket_db` database automatically if it does not exist.
- The `tickets` table is created automatically.
- 5 sample ticket records are inserted if the table is empty.
- The frontend fetches ticket data from `/tickets` and displays each ticket as a styled card.

## API

- `GET /tickets` - Returns JSON list of tickets:
  - `user_name`
  - `event`
  - `seat_no`

## Notes

- The frontend includes a QR code for each ticket using the Google Chart QR generator.
- Each QR code encodes ticket details and available seats remaining.

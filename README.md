# Rankers Royale

## Overview
Rankers Royale is a complete web application for ranking users by points earned per season from different fantasy sports websites. Users can redeem points through a shop or payouts directly to their fantasy sports website account wallets.

## Features
- Leaderboard ranking system based on points earned per season
- Points redemption via shop or direct payouts
- Discord OAuth2 login
- Admin page to manage shop items, user fantasy site usernames, and points
- Auto redeem/manual settings
- Leaderboard reset and new season management
- Chrome extension build mode

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm (comes with Node.js)
- (Optional) Docker, if you want to use the provided Docker setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy the sample environment file and fill in the required values (such as Discord OAuth credentials, database URLs, etc.):
```bash
cp sample.env .env
```

### 3. Start the App (Builds and Serves)
This command will build both the main app and the extension, then start the Express server serving the compiled frontend from `dist/`.
```bash
npm start
```
The app will be available at http://localhost:3000 (or the port specified in your environment variables).

### 4. Building Only the Main App or Extension
- To build only the main app:
  ```bash
  npm run buildapp
  ```
- To build only the Chrome extension:
  ```bash
  npm run buildext
  ```
- To build both (main app and extension):
  ```bash
  npm run build
  ```

### 5. Development Mode
- To run the Vite dev server for the main app:
  ```bash
  npm run dev
  ```
- To run the Vite dev server for the extension:
  ```bash
  npm run devext
  ```

### 6. Docker (Optional)
You can also run the app using Docker:
```bash
docker-compose up --build
```

---

**Note:**
- Make sure to configure your `.env` file before running the app.
- The extension build output will be in the appropriate directory (e.g., `dist/extension/`). You can load this as an unpacked extension in Chrome.
- There is no `build:extension` script; use `buildext` for the extension and `buildapp` for the main app.
- `npm start` is sufficient for production as it builds and starts the server.



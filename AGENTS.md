# museum-chatbot-api

A Node.js/Express REST API backend for the museum chatbot application. It proxies requests to the Google Gemini AI API, manages per-user conversation history in memory, and handles JWT-based authentication.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **AI:** Google Gemini API (via `axios`)
- **Auth:** JSON Web Tokens (`jsonwebtoken`), password hashing (`bcrypt`)
- **Database:** MongoDB (`mongodb`)
- **Other:** `cors`, `dotenv`, `nodemon`

## Setup

```bash
npm install
```

Create a `.env` file in the project root with:
```
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
```

## Build / Run / Test

```bash
# Start with hot-reload (development)
npm start
# (runs: nodemon index.js)

# No test suite configured
```

The server listens on port **8000** by default.

## Project Structure

```
index.js          # Single-file Express app — all routes and logic
package.json      # Dependencies and scripts
.env              # Environment variables (not committed; create manually)
```

## Architecture & Key Files

- `index.js` is the sole source file containing:
  - In-memory `conversationHistories` object keyed by `userId` (max 10 messages per user).
  - `getAIResponse()` — builds a prompt with conversation context and calls the Gemini API via `axios`.
  - Express routes for chat, authentication (JWT), and ticket booking flow.
- The AI prompt instructs Gemini to act as a museum booking assistant, returning a JSON object on line 1 and a human response on line 2.
- MongoDB is used for persistence (user accounts, bookings).

## Conventions & Notes for Agents

- All logic is in a single file (`index.js`) — no separate route or controller modules.
- Conversation history is in-memory and lost on server restart; it is not persisted to MongoDB.
- The server uses `cors()` with no origin restrictions — scope this down for production.
- `nodemon` is listed as a regular dependency (not devDependency); `npm start` triggers it.
- No test suite is present.
- Required env vars: `GEMINI_API_KEY`, `GEMINI_API_URL`, `JWT_SECRET`, `MONGODB_URI`.

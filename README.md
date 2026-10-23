# Real-time Notifications System

An Express, MongoDB, and Socket.IO notifications service. Users log in with a simple username, then receive their own notification events through a private Socket.IO room.

## Run locally

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Visit `http://localhost:3000` to use the test UI.

## Available endpoints

- `POST /api/auth/login`
- `POST /api/notifications` (Bearer token required)
- `GET /api/notifications?limit=20&unreadOnly=false` (Bearer token required)
- `PATCH /api/notifications/:id/read` (Bearer token required)
- `GET /api/health`

Socket clients authenticate with `io(url, { auth: { token } })`. Every authenticated client joins `user:<userId>` and receives `notification:new` and `notification:count`.

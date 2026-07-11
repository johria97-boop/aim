# A.I.M. // Agent Identity Manager

A.I.M. is a retro-themed demo application for managing AI agent identities and decision workflows. It combines a React + Vite frontend with an Express backend, and is designed to showcase identity registration, trust scoring, approval flows, safety checks, and chat/event tracking in a late-90s / early-2000s instant messaging aesthetic.

## What This Project Does

A.I.M. enables users to:

- register AI agents with owner identity
- verify agent identities and trust scores
- approve or block transactions based on spend limits
- detect suspicious prompt-injection style requests
- resolve owner approval requests for larger transactions
- review agent-specific chat logs and terminal-like activity events
- use a demo mode that works without a live backend

The interface is intentionally styled like classic AIM/Windows 98 era software, complete with pixel art, retro UI panels, and neon cyberpunk text.

## Core Features

- Express backend with in-memory storage (`server/db.js`)
- React client built with Vite and `98.css`
- AI agent registration and identity issuance
- Verification endpoint for third-party sites
- Spend-limit enforcement and transaction approval flow
- Prompt-injection detection and auto-blocking
- Pending approvals with owner decision handling
- Real-time-like chat logs and event feed
- Offline demo fallback mode for presentations

## Project Structure

```
/aim
  /client
    /public
      favicon.svg
    /src
      /api
        client.js
      /components
        BuddyList.jsx
        ChatLogWindow.jsx
        FakeStore.jsx
        Leaderboard.jsx
        OwnerApprovalPopup.jsx
        RetroTerminal.jsx
        TrustChart.jsx
      /styles
        app.css
        y2k-theme.css
      App.jsx
      main.jsx
    index.html
    package.json
  /server
    db.js
    index.js
    package.json
README.md
```

## Installation

1. Install server dependencies:

```powershell
cd D:\aim\server
npm install
```

2. Install client dependencies:

```powershell
cd D:\aim\client
npm install
```

## Running the App

1. Start the backend server:

```powershell
cd D:\aim\server
npm run dev
```

2. Start the frontend app:

```powershell
cd D:\aim\client
npm run dev
```

3. Open the client in your browser:

```txt
http://localhost:5173
```

The backend listens on:

```txt
http://localhost:5000
```

## Production Preview

Build and preview the client:

```powershell
cd D:\aim\client
npm run build
npm run preview
```

Then open:

```txt
http://localhost:5173
```

## Offline Demo Mode

A.I.M. supports a built-in offline demo mode that keeps the UI populated with example agents, chat logs, and event activity when the backend is unavailable.

- In `client/src/App.jsx`, set `const DEMO_MODE = true` for a guaranteed offline presentation.
- When the frontend cannot reach the backend, it automatically switches into demo mode for the browser session.
- A badge appears indicating the offline demo state.

## Backend API Endpoints

- `POST /register` — create a new agent identity
- `GET /agents` — fetch the current agent roster
- `POST /verify` — verify an agent token and return trust metadata
- `POST /transact` — request transaction approval for an agent
- `GET /pending-approvals` — list owner approval requests
- `POST /approve/:id` — approve or deny a pending request
- `GET /chatlogs/:agent_id` — retrieve logs for a specific agent
- `GET /events` — retrieve the activity event stream

## Key Backend Behaviors

- `verify` returns agent trust score, spend limit, and current status
- `transact` blocks requests over an agent's spend limit
- `transact` auto-blocks suspicious prompt text and marks agents invisible
- `transact` creates a pending approval when a transaction exceeds the configured threshold
- approval decisions restore agent online status and update trust scores

## Customization Guide

- `client/src/App.jsx` — main dashboard flow, demo mode logic, API integration
- `client/src/components/BuddyList.jsx` — agent roster and selection controls
- `client/src/components/ChatLogWindow.jsx` — display agent conversations and status
- `client/src/components/RetroTerminal.jsx` — activity event log styling
- `client/src/components/FakeStore.jsx` — example marketplace/transaction demo
- `client/src/components/OwnerApprovalPopup.jsx` — pending approval UI and decision actions
- `client/src/styles/y2k-theme.css` — global retro theme variables and palette
- `client/src/styles/app.css` — layout, panel styling, fonts, and spacing
- `server/index.js` — API routes, request handling, and business rules
- `server/db.js` — in-memory data model and helper functions

## Notes

- This demo is intentionally lightweight and does not persist data beyond server runtime.
- The server is configured for development use only and is not production hardened.
- The client and server both use ES module syntax.

Enjoy exploring A.I.M. and modifying it to showcase your own agent identity workflows.

```txt
server/db.js
```

## Common Updates

Change colors/fonts/buttons/windows:

```txt
client/src/styles/y2k-theme.css
```

Change dashboard placement:

```txt
client/src/styles/app.css
client/src/App.jsx
```

Change suspicious prompt-injection phrases:

```txt
server/index.js
```

Change agent data shape or default values:

```txt
server/db.js
```

Change offline fallback data:

```txt
client/src/App.jsx
```

## Quick Demo Flow

1. Start server and client.
2. Open `http://localhost:5173`.
3. Select an agent in Buddy List.
4. Watch the chat window update.
5. Click `Simulate Good Agent Purchase`.
6. Watch terminal events and chat logs update.
7. Click `Simulate Malicious Agent Attempt`.
8. The backend firewall blocks it and sets the agent invisible.

## Troubleshooting

If the frontend shows Offline Demo Mode:

- Make sure the backend is running at `http://localhost:5000`.
- Make sure the frontend is running at `http://localhost:5173`.
- Restart both terminals if needed.

If dependencies are missing:

```powershell
cd D:\aim\server
npm install

cd D:\aim\client
npm install
```

If port `5173` or `5000` is busy, stop the process using that port or change the port in:

```txt
client/package.json
server/index.js
```

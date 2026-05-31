# 🎬 Hollywood / Bollywood — Movie Guessing Game

Multiplayer movie guessing game built with the MERN stack + Socket.io.

## How to Play

- **Picker** types or generates a random movie title
- **Guesser** reveals letters one at a time using the A–Z keyboard
- **9 chances** — one per letter in H·O·L·L·Y·W·O·O·D
- **1 hint** per game — picker types a hint, guesser receives it
- **Full guess** — guesser can attempt the full movie title at any time
- **Chat** — both players chat throughout the game (multiplayer only)
- **Roles swap** each round

---

## 🚀 Quick Start (Local)

### 1. Install dependencies

```bash
npm install             # root (installs concurrently)
npm run install:all     # installs server + client deps
```

### 2. Set up environment

```bash
# Copy server env template
cp server/.env.example server/.env
# Edit server/.env and add your MongoDB URI (or use local MongoDB)
```

### 3. Run both server + client

```bash
npm run dev
```

- Server → http://localhost:5000
- Client → http://localhost:5173

---

## 🌐 Deployment

### Frontend → Vercel

1. Push the `client/` folder (or the whole repo) to GitHub
2. Go to [vercel.com](https://vercel.com), import the project
3. Set **Root Directory** to `client`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Add environment variable:
   ```
   VITE_SERVER_URL = https://your-railway-app.railway.app
   ```
7. Deploy ✅

### Backend → Railway

1. Go to [railway.app](https://railway.app), create a new project
2. Connect your GitHub repo, set **Root Directory** to `server`
3. Add environment variables:
   ```
   MONGO_URI   = mongodb+srv://...  (from MongoDB Atlas)
   CLIENT_URL  = https://your-vercel-app.vercel.app
   PORT        = 5000  (Railway auto-sets this)
   ```
4. Deploy ✅

### Database → MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist all IPs: `0.0.0.0/0`
4. Copy the connection string into `MONGO_URI`

---

## 📁 Project Structure

```
├── server/                  # Node.js + Express + Socket.io
│   ├── index.js             # Entry point
│   ├── models/Room.js       # MongoDB schema
│   ├── socket/gameHandler.js # All game socket events
│   ├── data/
│   │   ├── hollywood.js     # Hollywood movie list
│   │   └── bollywood.js     # Bollywood movie list
│   └── utils/computer.js   # CPU guessing strategy
│
├── client/                  # React 18 + Vite
│   ├── vercel.json          # SPA routing for Vercel
│   └── src/
│       ├── context/GameContext.jsx  # Global state + socket events
│       ├── pages/
│       │   ├── Home.jsx     # Landing page
│       │   ├── Lobby.jsx    # Waiting room
│       │   └── Game.jsx     # Game screen
│       └── components/
│           ├── MovieDisplay.jsx  # Blanks display
│           ├── Keyboard.jsx      # A–Z letter grid
│           ├── LivesDisplay.jsx  # HOLLYWOOD lives
│           ├── Chat.jsx          # Real-time chat
│           └── HintBox.jsx       # Hint banner
│
└── package.json             # Root: run both with `npm run dev`
```

---

## 🛠 Tech Stack

| Layer     | Tech                             |
|-----------|----------------------------------|
| Frontend  | React 18, Vite, React Router 6   |
| Backend   | Node.js, Express 4               |
| Real-time | Socket.io 4                      |
| Database  | MongoDB + Mongoose               |
| Deploy FE | Vercel                           |
| Deploy BE | Railway / Render                 |

import { io } from 'socket.io-client';

// In production: set VITE_SERVER_URL to your Railway/Render backend URL.
// In local dev: leave it empty — Vite proxy will forward to localhost:5000.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export default socket;

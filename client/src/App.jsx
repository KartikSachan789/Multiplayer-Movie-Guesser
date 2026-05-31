import { Routes, Route, Navigate } from 'react-router-dom';
import { useGame } from './context/GameContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';

export default function App() {
  const { state } = useGame();
  const { gameStatus } = state;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/lobby"
        element={gameStatus === 'lobby' ? <Lobby /> : <Navigate to="/" replace />}
      />
      <Route
        path="/game"
        element={
          ['picking', 'playing', 'ended'].includes(gameStatus)
            ? <Game />
            : <Navigate to="/" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

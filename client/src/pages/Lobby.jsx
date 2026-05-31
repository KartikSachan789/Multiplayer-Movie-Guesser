import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function Lobby() {
  const { state } = useGame();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h1 className="lobby-title">Room Ready</h1>
        <p className="lobby-sub">Share this code with your opponent</p>

        <button
          className="room-code-display"
          onClick={copyCode}
          aria-label="Copy room code"
          id="copy-room-code"
        >
          <span className="room-code">{state.roomCode}</span>
          <span className="copy-hint">{copied ? '✓ Copied!' : 'tap to copy'}</span>
        </button>

        <div className="waiting-row">
          <span className="waiting-dot" aria-hidden="true" />
          <p>Waiting for opponent to join...</p>
        </div>

        <div className="lobby-meta">
          <span className="badge">{state.category}</span>
          <span className="badge">You: {state.playerName}</span>
          <span className="badge">Picker</span>
        </div>
      </div>
    </div>
  );
}

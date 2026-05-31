import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function Home() {
  const { state, actions } = useGame();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('hollywood');
  const [mode, setMode] = useState(null); // 'create' | 'join' | 'computer'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    actions.clearError();

    if (mode === 'create') {
      actions.createRoom(name.trim(), category);
    } else if (mode === 'join') {
      if (!code.trim()) { setLoading(false); return; }
      actions.joinRoom(name.trim(), code.trim());
    } else if (mode === 'computer') {
      // VS Computer: player is always the guesser — no role selection needed
      actions.startVsComputer(name.trim(), category);
    }

    setTimeout(() => setLoading(false), 4000);
  };

  const selectMode = (m) => {
    setMode(prev => (prev === m ? null : m));
    actions.clearError();
  };

  const canSubmit =
    name.trim() &&
    mode &&
    (mode !== 'join' || code.trim());

  return (
    <div className="home">
      <header className="home-hero">
        <h1 className="home-title">
          <span className="title-accent">HOLLY</span>
          <span className="title-sep">/</span>
          <span className="title-accent">BOLLY</span>
          <span className="title-plain">WOOD</span>
        </h1>
        <p className="home-tagline">The Movie Guessing Game</p>
      </header>

      <main className="home-card">
        {/* Name */}
        <div className="input-group">
          <label htmlFor="player-name">Your Name</label>
          <input
            id="player-name"
            type="text"
            placeholder="Enter your name..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleAction()}
            maxLength={20}
            autoComplete="off"
          />
        </div>

        {/* Category */}
        <div className="input-group">
          <label>Category</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${category === 'hollywood' ? 'active' : ''}`}
              onClick={() => setCategory('hollywood')}
              id="cat-hollywood"
            >
              Hollywood
            </button>
            <button
              className={`toggle-btn ${category === 'bollywood' ? 'active' : ''}`}
              onClick={() => setCategory('bollywood')}
              id="cat-bollywood"
            >
              Bollywood
            </button>
          </div>
        </div>

        {/* Mode */}
        <div className="input-group">
          <label>Mode</label>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
              onClick={() => selectMode('create')}
              id="mode-create"
            >
              <span className="mode-icon">🎬</span>
              <span>Create Room</span>
            </button>
            <button
              className={`mode-btn ${mode === 'join' ? 'active' : ''}`}
              onClick={() => selectMode('join')}
              id="mode-join"
            >
              <span className="mode-icon">🔑</span>
              <span>Join Room</span>
            </button>
            <button
              className={`mode-btn ${mode === 'computer' ? 'active' : ''}`}
              onClick={() => selectMode('computer')}
              id="mode-computer"
            >
              <span className="mode-icon">🤖</span>
              <span>vs CPU</span>
            </button>
          </div>
        </div>

        {/* Join: code input */}
        {mode === 'join' && (
          <div className="input-group slide-in">
            <label htmlFor="room-code-input">Room Code</label>
            <input
              id="room-code-input"
              type="text"
              placeholder="e.g. A3BX9K"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && canSubmit && handleAction()}
              maxLength={6}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        )}

        {/* VS CPU explanation */}
        {mode === 'computer' && (
          <p className="mode-note slide-in">
            CPU will pick a random movie — you guess it letter by letter.
          </p>
        )}

        {/* Create explanation */}
        {mode === 'create' && (
          <p className="mode-note slide-in">
            You'll get a room code to share. You pick the movie, your friend guesses.
          </p>
        )}

        {/* Error */}
        {state.error && (
          <p className="error-msg" role="alert">{state.error}</p>
        )}

        {/* Submit */}
        {mode && (
          <button
            id="submit-action"
            className="btn-primary"
            onClick={handleAction}
            disabled={!canSubmit || loading}
          >
            {loading ? 'Connecting...' : (
              mode === 'create' ? 'Create Room' :
              mode === 'join'   ? 'Join Room'   :
                                  'Start vs CPU'
            )}
          </button>
        )}
      </main>

      <aside className="home-rules">
        <h2 className="rules-title">How to Play</h2>
        <ul className="rules-list">
          <li><strong>Multiplayer:</strong> Room creator picks a movie (or generates random) — other player guesses</li>
          <li><strong>vs CPU:</strong> CPU picks a movie — you guess letter by letter</li>
          <li><strong>9 chances</strong> — one per letter in H·O·L·L·Y·W·O·O·D</li>
          <li>Picker can give <strong>one hint</strong> per game</li>
          <li>Guess the full title to win instantly</li>
          <li>Both players can <strong>chat</strong> throughout (multiplayer)</li>
        </ul>
      </aside>
    </div>
  );
}

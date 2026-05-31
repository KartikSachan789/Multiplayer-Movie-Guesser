import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import MovieDisplay from '../components/MovieDisplay';
import Keyboard from '../components/Keyboard';
import LivesDisplay from '../components/LivesDisplay';
import Chat from '../components/Chat';
import HintBox from '../components/HintBox';
import Scoreboard from '../components/Scoreboard';
import RoundHistory from '../components/RoundHistory';

export default function Game() {
  const { state, actions } = useGame();
  const navigate = useNavigate();

  const [movieInput, setMovieInput]     = useState('');
  const [fullGuess, setFullGuess]       = useState('');
  const [hintInput, setHintInput]       = useState('');
  const [showHintInput, setShowHintInput] = useState(false);
  const [showHistory, setShowHistory]   = useState(false);

  const {
    role, gameMode, gameStatus,
    blanks, movie, movieInfo,
    guessedLetters, wrongGuesses,
    hintUsed, hint, messages,
    result, playerName, players,
    roomCode, category,
    wrongFullGuess, wrongGuessText, error,
    round, maxRounds,
    scores, roundHistory, guesserDelta, pickerDelta, badge,
    isMatchOver, matchWinner,
    typingPlayer, floatingEmojis
  } = state;

  // Clear wrong-guess banner after 2.5s
  useEffect(() => {
    if (wrongFullGuess) {
      const t = setTimeout(() => actions.clearWrongGuess(), 2500);
      return () => clearTimeout(t);
    }
  }, [wrongFullGuess]);

  const pickerName  = players.find(p => p.role === 'picker')?.name  || 'Picker';
  const guesserName = players.find(p => p.role === 'guesser')?.name || 'Guesser';

  // Score delta object for Scoreboard
  const scoreDeltas = (guesserDelta != null || pickerDelta != null) ? {
    guesserName: players.find(p => p.role === 'guesser')?.name || playerName,
    pickerName:  players.find(p => p.role === 'picker')?.name  || '',
    guesserDelta, pickerDelta
  } : null;

  const handleSubmitMovie = (isRandom) => {
    if (!isRandom && !movieInput.trim()) return;
    actions.submitMovie(isRandom ? '' : movieInput.trim(), isRandom);
    setMovieInput('');
  };

  const handleGuessLetter = (letter) => {
    if (gameStatus !== 'playing' || role !== 'guesser') return;
    actions.guessLetter(letter);
  };

  const handleFullGuess = () => {
    if (!fullGuess.trim()) return;
    actions.guessMovie(fullGuess.trim());
    setFullGuess('');
  };

  const handleSendHint = () => {
    if (!hintInput.trim() || hintUsed) return;
    actions.giveHint(hintInput.trim());
    setHintInput('');
    setShowHintInput(false);
  };

  // ── Points formula info string ───────────────────────────────
  const scoringNote = () => {
    const remaining = maxRounds - round + 1;
    return `Win in 0 wrong = 90pts · each wrong -10 · lose = -20pts · picker gets +30 if you fail`;
  };

  // ══════════════════════════════════════════════════════
  //  MATCH OVER — full session results
  // ══════════════════════════════════════════════════════
  if (isMatchOver && (gameStatus === 'ended' || gameMode === 'computer')) {
    const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topScore      = sortedPlayers[0]?.[1] || 0;
    const isWinner      = gameMode === 'computer' ? true : matchWinner === playerName;

    return (
      <div className="match-over-page">
        <div className="match-over-card">
          <span className="match-trophy">
            {gameMode === 'computer' ? '🎬' : isWinner ? '🏆' : '🥈'}
          </span>
          <h1 className="match-over-title">
            {gameMode === 'computer'
              ? 'Match Complete!'
              : matchWinner
                ? (isWinner ? 'You Win the Match! 🎉' : `${matchWinner} wins!`)
                : "It's a Tie! 🤝"}
          </h1>

          {/* Final scores */}
          <div className="match-final-scores">
            {sortedPlayers.map(([name, pts], i) => (
              <div key={name} className={`final-score-row ${i === 0 ? 'top' : ''}`}>
                <span className="final-rank">{i === 0 ? '🥇' : '🥈'}</span>
                <span className="final-name">
                  {name} {name === playerName && <span className="you-tag">you</span>}
                </span>
                <span className="final-pts">{pts} pts</span>
              </div>
            ))}
          </div>

          {/* Round history */}
          <div className="match-history-list">
            {roundHistory.map((r, i) => (
              <div key={i} className={`rh-row ${r.won ? 'rh-won' : 'rh-lost'}`}>
                <span className="rh-round">R{r.round}</span>
                <span className="rh-badge">{r.badge?.emoji} {r.badge?.label}</span>
                <span className="rh-movie" title={r.movie}>{r.movie}</span>
                <span className={`rh-delta ${r.guesserDelta >= 0 ? 'pos' : 'neg'}`}>
                  {r.guesserDelta >= 0 ? '+' : ''}{r.guesserDelta}
                </span>
              </div>
            ))}
          </div>

          <div className="overlay-actions">
            <button className="btn-primary" id="new-match-btn" onClick={() => { actions.resetGame(); navigate('/'); }}>
              New Match
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  //  PICKING PHASE
  // ══════════════════════════════════════════════════════
  if (gameStatus === 'picking') {
    return (
      <div className="game-page">
        <div className="game-header mini-header">
          <span className="badge">{category}</span>
          {roomCode && <span className="room-tag">#{roomCode}</span>}
          <span className="header-spacer" />
          <span className="role-label-sm">{role === 'picker' ? '🎬 Picker' : '🔤 Guesser'}</span>
        </div>

        <Scoreboard
          players={players} scores={scores} round={round} maxRounds={maxRounds}
          gameMode={gameMode} playerName={playerName} scoreDeltas={null}
        />

        <div className="pick-layout">
          {role === 'picker' ? (
            <div className="pick-screen">
              <p className="role-label">You are the <strong className="role-accent">PICKER</strong></p>
              <h1 className="pick-heading">Choose a movie</h1>
              <p className="pick-sub">{guesserName} will guess it</p>

              <div className="pick-form">
                <input
                  id="movie-title-input" type="text"
                  placeholder="Type a movie title..."
                  value={movieInput}
                  onChange={e => setMovieInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitMovie(false)}
                  autoComplete="off" spellCheck="false" autoFocus
                />
                <div className="pick-actions">
                  <button id="set-movie-btn" className="btn-primary"
                    onClick={() => handleSubmitMovie(false)} disabled={!movieInput.trim()}>
                    Set Movie
                  </button>
                  <button id="random-movie-btn" className="btn-secondary"
                    onClick={() => handleSubmitMovie(true)}>
                    🎲 Random
                  </button>
                </div>
                <p className="pick-note">Only you see the movie — {guesserName} sees blanks.</p>
              </div>
            </div>
          ) : (
            <div className="pick-screen">
              <p className="role-label">You are the <strong className="role-accent">GUESSER</strong></p>
              <div className="waiting-row">
                <span className="waiting-dot" />
                <p>{pickerName} is choosing a movie...</p>
              </div>
              <p className="scoring-tip">💡 Fewer wrong guesses = more points</p>
            </div>
          )}

          <Chat messages={messages} onSend={actions.sendChat} playerName={playerName}
            onTyping={actions.sendTyping} typingPlayer={typingPlayer} />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  //  PLAYING / ENDED PHASE
  // ══════════════════════════════════════════════════════
  return (
    <div className="game-page">
      {/* Floating emoji animations */}
      <div className="emoji-float-layer" aria-hidden="true">
        {floatingEmojis.map(fe => (
          <div key={fe.id} className="emoji-float">
            <span className="emoji-float-char">{fe.emoji}</span>
            <span className="emoji-float-name">{fe.name}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="game-header">
        <div className="header-left">
          <span className="badge">{category}</span>
          {roomCode && <span className="room-tag">#{roomCode}</span>}
          {gameMode === 'computer' && <span className="badge cpu-badge">vs CPU</span>}
        </div>
        <div className="header-center">
          <LivesDisplay wrongGuesses={wrongGuesses} />
        </div>
        <div className="header-right">
          <span className="role-label-sm">{role === 'picker' ? '🎬 Picker' : '🔤 Guesser'}</span>
          {roundHistory.length > 0 && (
            <button className="btn-ghost history-toggle"
              onClick={() => setShowHistory(h => !h)}
              title="Toggle round history">
              📊
            </button>
          )}
        </div>
      </div>

      {/* Live Scoreboard */}
      <Scoreboard
        players={players} scores={scores} round={round} maxRounds={maxRounds}
        gameMode={gameMode} playerName={playerName}
        scoreDeltas={gameStatus === 'ended' ? scoreDeltas : null}
      />

      {/* Round history drawer */}
      {showHistory && (
        <div className="history-drawer">
          <RoundHistory history={roundHistory} players={players} />
        </div>
      )}

      {/* Game Layout */}
      <div className="game-layout">
        <div className="game-main">
          {hint && <HintBox hint={hint} />}

          {wrongFullGuess && (
            <div className="wrong-banner" role="alert">
              ✗ &ldquo;{wrongGuessText}&rdquo; — wrong! Keep guessing letters.
            </div>
          )}

          <MovieDisplay blanks={blanks} />

          {movieInfo && (
            <p className="movie-meta">
              {movieInfo.wordCount} {movieInfo.wordCount === 1 ? 'word' : 'words'}
              {' · '}{movieInfo.wordLengths.join(' + ')} letters
            </p>
          )}

          {/* GUESSER view */}
          {role === 'guesser' && gameStatus === 'playing' && (
            <>
              <div className="scoring-bar">
                <span className="scoring-preview">
                  Correct now: <strong className="accent-text">+{Math.max(10, (9 - wrongGuesses) * 10)} pts</strong>
                </span>
              </div>

              <Keyboard guessedLetters={guessedLetters} blanks={blanks} onGuess={handleGuessLetter} />

              <div className="full-guess-row">
                <input
                  id="full-guess-input" type="text"
                  placeholder="Guess the full movie title..."
                  value={fullGuess}
                  onChange={e => setFullGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFullGuess()}
                  autoComplete="off"
                />
                <button id="full-guess-btn" className="btn-secondary"
                  onClick={handleFullGuess} disabled={!fullGuess.trim()}>
                  Guess
                </button>
              </div>

              {/* Hint button — shown in both modes for guesser */}
              {gameMode === 'computer' && !hintUsed && (
                <button id="get-hint-btn" className="btn-hint"
                  onClick={() => actions.giveHint('auto')}>
                  💡 Get Hint <span className="hint-count">(1 left)</span>
                </button>
              )}
              {gameMode === 'computer' && hintUsed && <p className="hint-used-note">Hint used ✓</p>}
            </>
          )}

          {/* PICKER view */}
          {role === 'picker' && gameStatus === 'playing' && (
            <div className="picker-panel">
              <div className="movie-reveal-box">
                <span className="muted-sm">Movie</span>
                <span className="movie-full-text">{movie}</span>
              </div>

              {!hintUsed && !showHintInput && (
                <button id="give-hint-btn" className="btn-hint"
                  onClick={() => setShowHintInput(true)}>
                  💡 Give Hint to {guesserName} <span className="hint-count">(1 available)</span>
                </button>
              )}

              {showHintInput && !hintUsed && (
                <div className="hint-form">
                  <input
                    id="hint-input" type="text"
                    placeholder={`Type a hint for ${guesserName}...`}
                    value={hintInput}
                    onChange={e => setHintInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendHint()}
                    maxLength={120} autoFocus
                  />
                  <div className="hint-form-actions">
                    <button id="send-hint-btn" className="btn-secondary"
                      onClick={handleSendHint} disabled={!hintInput.trim()}>
                      Send Hint
                    </button>
                    <button className="btn-ghost"
                      onClick={() => { setShowHintInput(false); setHintInput(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {hintUsed && <p className="hint-used-note">Hint sent to {guesserName} ✓</p>}

              <p className="picker-watching">Watching {guesserName} guess...</p>
            </div>
          )}
        </div>

        {/* Chat — multiplayer only */}
        {gameMode === 'multiplayer' && (
          <Chat messages={messages} onSend={actions.sendChat} playerName={playerName}
            onTyping={actions.sendTyping} typingPlayer={typingPlayer} />
        )}
      </div>

      {/* GAME OVER OVERLAY */}
      {gameStatus === 'ended' && !isMatchOver && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="overlay-card">
            {/* Badge */}
            {badge && (
              <div className="perf-badge">
                <span className="perf-emoji">{badge.emoji}</span>
                <span className="perf-label">{badge.label}</span>
              </div>
            )}

            {result === 'won' && (
              <>
                <span className="result-emoji">🎉</span>
                <h2 className="result-title">
                  {role === 'guesser' ? 'You guessed it!' : `${guesserName} got it!`}
                </h2>
              </>
            )}
            {result === 'lost' && (
              <>
                <span className="result-emoji">💀</span>
                <h2 className="result-title">
                  {role === 'guesser' ? 'Out of chances!' : `${guesserName} failed!`}
                </h2>
              </>
            )}
            {!result && !error && (
              <>
                <span className="result-emoji">🎬</span>
                <h2 className="result-title">Game Over</h2>
              </>
            )}
            {error && (
              <>
                <span className="result-emoji">👋</span>
                <h2 className="result-title">Game Over</h2>
                <p className="result-error">{error}</p>
              </>
            )}

            {(movie || state.movie) && (
              <p className="result-movie">
                The movie was <strong>{movie || state.movie}</strong>
              </p>
            )}

            {/* Score deltas */}
            {(guesserDelta != null || pickerDelta != null) && (
              <div className="round-score-summary">
                {role === 'guesser' && guesserDelta != null && (
                  <div className={`delta-pill ${guesserDelta >= 0 ? 'pos' : 'neg'}`}>
                    You: {guesserDelta >= 0 ? '+' : ''}{guesserDelta} pts
                  </div>
                )}
                {role === 'picker' && pickerDelta != null && (
                  <div className={`delta-pill ${pickerDelta >= 0 ? 'pos' : 'neg'}`}>
                    You: {pickerDelta >= 0 ? '+' : ''}{pickerDelta} pts
                  </div>
                )}
                {/* Show current totals */}
                <div className="score-totals">
                  {Object.entries(scores).map(([name, pts]) => (
                    <span key={name} className="total-item">
                      {name}: <strong>{pts}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Round progress */}
            <p className="round-progress-note">
              Round {round} of {maxRounds}
              {round < maxRounds ? ` · ${maxRounds - round} round${maxRounds - round > 1 ? 's' : ''} left` : ' · Last round!'}
            </p>

            <div className="overlay-actions">
              {!error && (
                <button id="play-again-btn" className="btn-primary" onClick={actions.playAgain}>
                  {round >= maxRounds
                    ? '🏆 View Match Results'
                    : `Next Round →`}
                </button>
              )}
              <button id="home-btn" className="btn-ghost" onClick={() => { actions.resetGame(); navigate('/'); }}>
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

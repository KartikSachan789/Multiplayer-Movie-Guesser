/**
 * Scoreboard — shows both players' live scores + round progress.
 * scoreDeltas: { guesserName, pickerName, guesserDelta, pickerDelta }
 */
export default function Scoreboard({ players, scores, round, maxRounds, gameMode, playerName, scoreDeltas }) {
  if (gameMode === 'computer') {
    // VS Computer — single player score
    const pts = scores[playerName] || 0;
    return (
      <div className="scoreboard cpu-scoreboard">
        <div className="score-cell">
          <span className="score-name">{playerName}</span>
          <span className="score-pts">
            {pts}
            {scoreDeltas?.guesserDelta != null && (
              <span className={`score-delta ${scoreDeltas.guesserDelta >= 0 ? 'pos' : 'neg'}`}>
                {scoreDeltas.guesserDelta >= 0 ? '+' : ''}{scoreDeltas.guesserDelta}
              </span>
            )}
          </span>
          <span className="score-label">pts</span>
        </div>
        <div className="round-tracker">
          <span className="round-pips">
            {Array.from({ length: maxRounds }).map((_, i) => (
              <span key={i} className={`round-pip ${i < round - 1 ? 'done' : i === round - 1 ? 'current' : ''}`} />
            ))}
          </span>
          <span className="round-text">Round {round} / {maxRounds}</span>
        </div>
      </div>
    );
  }

  // Multiplayer — two players
  const picker  = players.find(p => p.role === 'picker');
  const guesser = players.find(p => p.role === 'guesser');
  const p1      = picker  || players[0];
  const p2      = guesser || players[1];
  if (!p1 || !p2) return null;

  const s1 = scores[p1.name] || 0;
  const s2 = scores[p2.name] || 0;

  const d1 = p1.name === scoreDeltas?.guesserName ? scoreDeltas?.guesserDelta
           : p1.name === scoreDeltas?.pickerName  ? scoreDeltas?.pickerDelta
           : null;
  const d2 = p2.name === scoreDeltas?.guesserName ? scoreDeltas?.guesserDelta
           : p2.name === scoreDeltas?.pickerName  ? scoreDeltas?.pickerDelta
           : null;

  const isLeading1 = s1 > s2;
  const isLeading2 = s2 > s1;

  return (
    <div className="scoreboard">
      <div className={`score-cell ${isLeading1 ? 'leading' : ''}`}>
        <span className="score-name">
          {p1.name} {p1.name === playerName && <span className="you-tag">you</span>}
        </span>
        <div className="score-pts-row">
          <span className="score-pts">{s1}</span>
          {d1 != null && (
            <span className={`score-delta ${d1 >= 0 ? 'pos' : 'neg'}`}>
              {d1 >= 0 ? '+' : ''}{d1}
            </span>
          )}
        </div>
        <span className="score-role-tag">{p1.role === 'picker' ? '🎬 Picker' : '🔤 Guesser'}</span>
      </div>

      <div className="round-tracker">
        <span className="round-pips">
          {Array.from({ length: maxRounds }).map((_, i) => (
            <span key={i} className={`round-pip ${i < round - 1 ? 'done' : i === round - 1 ? 'current' : ''}`} />
          ))}
        </span>
        <span className="round-text">Round {round}/{maxRounds}</span>
        <span className="round-sub">pts</span>
      </div>

      <div className={`score-cell right ${isLeading2 ? 'leading' : ''}`}>
        <span className="score-name">
          {p2.name} {p2.name === playerName && <span className="you-tag">you</span>}
        </span>
        <div className="score-pts-row">
          <span className="score-pts">{s2}</span>
          {d2 != null && (
            <span className={`score-delta ${d2 >= 0 ? 'pos' : 'neg'}`}>
              {d2 >= 0 ? '+' : ''}{d2}
            </span>
          )}
        </div>
        <span className="score-role-tag">{p2.role === 'picker' ? '🎬 Picker' : '🔤 Guesser'}</span>
      </div>
    </div>
  );
}

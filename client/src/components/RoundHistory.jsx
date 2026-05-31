/**
 * RoundHistory — collapsible panel showing all past round results.
 */
export default function RoundHistory({ history, players }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="round-history">
      <p className="rh-title">Round History</p>
      {history.map((r, i) => (
        <div key={i} className={`rh-row ${r.won ? 'rh-won' : 'rh-lost'}`}>
          <span className="rh-round">R{r.round}</span>
          <span className="rh-badge">{r.badge?.emoji}</span>
          <span className="rh-movie">{r.movie}</span>
          <span className="rh-wrong">{r.wrongGuesses} ✗</span>
          <span className={`rh-delta ${r.guesserDelta >= 0 ? 'pos' : 'neg'}`}>
            {r.guesserDelta >= 0 ? '+' : ''}{r.guesserDelta}
          </span>
        </div>
      ))}
    </div>
  );
}

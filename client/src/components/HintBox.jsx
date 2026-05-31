/**
 * HintBox — displays the hint given by the picker (or system).
 */
export default function HintBox({ hint }) {
  if (!hint) return null;

  return (
    <div className="hint-box" role="note" aria-label="Hint">
      <span className="hint-icon">💡</span>
      <span className="hint-text">{hint}</span>
    </div>
  );
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

/**
 * Keyboard — A–Z grid. Keys are marked correct (green) or wrong (red) after guessing.
 */
export default function Keyboard({ guessedLetters, blanks, onGuess }) {
  // Letters currently visible in the blanks (correctly guessed)
  const revealedSet = new Set(
    (blanks || []).filter(b => b !== '_' && b !== ' ')
  );

  return (
    <div className="keyboard" aria-label="Letter keyboard" role="group">
      {ROWS.map((row, ri) => (
        <div key={ri} className="keyboard-row">
          {row.map(letter => {
            const guessed = guessedLetters.includes(letter);
            const correct = revealedSet.has(letter);
            const wrong = guessed && !correct;

            return (
              <button
                key={letter}
                id={`key-${letter}`}
                className={`key ${correct ? 'key-correct' : ''} ${wrong ? 'key-wrong' : ''}`}
                onClick={() => onGuess(letter)}
                disabled={guessed}
                aria-label={`Letter ${letter}${guessed ? (correct ? ', correct' : ', wrong') : ''}`}
                aria-pressed={guessed}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

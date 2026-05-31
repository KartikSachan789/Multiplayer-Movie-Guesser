// H-O-L-L-Y-W-O-O-D = 9 letters = 9 lives
const LIVES_WORD = ['H', 'O', 'L', 'L', 'Y', 'W', 'O', 'O', 'D'];

/**
 * LivesDisplay — shows HOLLYWOOD with struck-through letters for wrong guesses.
 */
export default function LivesDisplay({ wrongGuesses }) {
  const remaining = LIVES_WORD.length - wrongGuesses;

  return (
    <div className="lives-display" aria-label={`${remaining} lives remaining`}>
      {LIVES_WORD.map((letter, i) => (
        <span
          key={i}
          className={`life-letter ${i < wrongGuesses ? 'life-used' : ''}`}
          aria-hidden="true"
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

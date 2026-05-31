/**
 * MovieDisplay — renders the blanked-out movie title word by word.
 * Spaces are preserved as gaps between word groups.
 */
export default function MovieDisplay({ blanks }) {
  if (!blanks || blanks.length === 0) {
    return (
      <div className="movie-display empty">
        <span className="empty-label">Waiting for movie...</span>
      </div>
    );
  }

  // Group characters into words (split on space)
  const words = [];
  let currentWord = [];

  blanks.forEach((char, i) => {
    if (char === ' ') {
      if (currentWord.length > 0) {
        words.push(currentWord);
        currentWord = [];
      }
    } else {
      currentWord.push({ char, index: i });
    }
  });
  if (currentWord.length > 0) words.push(currentWord);

  return (
    <div className="movie-display" aria-label="Movie title display">
      {words.map((word, wi) => (
        <div key={wi} className="movie-word" aria-label={`Word ${wi + 1}`}>
          {word.map(({ char, index }) => {
            const revealed = char !== '_';
            return (
              <div
                key={index}
                className={`letter-cell ${revealed ? 'revealed' : ''}`}
                aria-label={revealed ? char : 'blank'}
              >
                <span className="letter-char">{revealed ? char : ''}</span>
                <span className="letter-line" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

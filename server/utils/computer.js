// Letter frequency strategy for English movie titles
// Ordered by how commonly they appear in movie titles
const LETTER_FREQUENCY = [
  'E', 'T', 'A', 'O', 'I', 'N', 'S', 'R', 'H', 'L',
  'D', 'C', 'U', 'M', 'W', 'F', 'G', 'Y', 'P', 'B',
  'V', 'K', 'J', 'X', 'Q', 'Z'
];

/**
 * Get the next best letter for the computer to guess.
 * Avoids already-guessed letters and prefers common ones.
 * @param {string[]} guessedLetters - Letters already guessed
 * @param {string[]} blanks - Current state of blanks
 * @returns {string|null} Next letter to guess, or null if all tried
 */
function getComputerGuess(guessedLetters, blanks) {
  // First pass: use frequency list
  for (const letter of LETTER_FREQUENCY) {
    if (!guessedLetters.includes(letter)) {
      return letter;
    }
  }
  return null;
}

/**
 * Generate a hint when computer is the picker (auto-hint).
 * Reveals the position of one unrevealed letter.
 * @param {string[]} blanks
 * @param {string} movie
 * @returns {string} hint text
 */
function generateAutoHint(blanks, movie) {
  const unrevealedIndices = [];
  blanks.forEach((b, i) => {
    if (b === '_') unrevealedIndices.push(i);
  });

  if (unrevealedIndices.length === 0) return 'All letters are revealed!';

  // Pick a random unrevealed position
  const idx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
  const letter = movie[idx];
  const wordNum = movie.slice(0, idx + 1).split(' ').length;
  const posInWord = idx - movie.slice(0, idx).lastIndexOf(' ') - 1 + 1;

  return `Word ${wordNum}, position ${posInWord} is the letter "${letter}"`;
}

module.exports = { getComputerGuess, generateAutoHint };

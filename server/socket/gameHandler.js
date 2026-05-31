const hollywood = require('../data/hollywood');
const bollywood = require('../data/bollywood');
const { getComputerGuess, generateAutoHint } = require('../utils/computer');

const LIVES = ['H', 'O', 'L', 'L', 'Y', 'W', 'O', 'O', 'D'];
const MAX_WRONG = LIVES.length; // 9
const MAX_ROUNDS = 6; // 3 rounds each player picks once

// In-Memory Stores
const rooms = new Map();
const computerGames = new Map();

// ─── Helpers ──────────────────────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getRandomMovie(category) {
  const list = category === 'bollywood' ? bollywood : hollywood;
  return list[Math.floor(Math.random() * list.length)];
}

function movieToBlanks(movie) {
  return movie.split('').map(ch => (ch === ' ' ? ' ' : '_'));
}

function revealLetters(blanks, movie, letter) {
  return blanks.map((b, i) => (movie[i] === letter ? letter : b));
}

function isWon(blanks) {
  return !blanks.includes('_');
}

function getMovieInfo(movie) {
  const words = movie.trim().split(/\s+/);
  return { totalLength: movie.length, wordCount: words.length, wordLengths: words.map(w => w.length) };
}

// ─── Scoring ──────────────────────────────────────────────────────
function calcGuesserDelta(won, wrongGuesses) {
  if (won) return Math.max(10, (MAX_WRONG - wrongGuesses) * 10);
  return -20;
}

function calcPickerDelta(guesserWon) {
  return guesserWon ? 0 : 30; // Picker gets 30 if they stumped the guesser
}

function performanceBadge(won, wrongGuesses) {
  if (!won) return { label: 'Stumped!',    emoji: '💀' };
  if (wrongGuesses <= 1) return { label: 'Genius!',    emoji: '🧠' };
  if (wrongGuesses <= 3) return { label: 'Sharp!',     emoji: '⚡' };
  if (wrongGuesses <= 6) return { label: 'Close!',     emoji: '😅' };
  return { label: 'Squeaked by!', emoji: '😤' };
}

function finalizeRound(room, won) {
  const guesser = room.players.find(p => p.role === 'guesser');
  const picker  = room.players.find(p => p.role === 'picker');

  const guesserDelta = calcGuesserDelta(won, room.wrongGuesses);
  const pickerDelta  = calcPickerDelta(won);

  if (guesser) room.scores[guesser.name] = (room.scores[guesser.name] || 0) + guesserDelta;
  if (picker)  room.scores[picker.name]  = (room.scores[picker.name]  || 0) + pickerDelta;

  const badge = performanceBadge(won, room.wrongGuesses);
  const entry = {
    round:        room.round,
    pickerName:   picker?.name  || '',
    guesserName:  guesser?.name || '',
    movie:        room.movie,
    won,
    wrongGuesses: room.wrongGuesses,
    guesserDelta,
    pickerDelta,
    badge
  };
  room.roundHistory.push(entry);

  return { guesserDelta, pickerDelta, badge };
}

// ─── Main Handler ─────────────────────────────────────────────────
module.exports = function gameHandler(io, socket) {

  // ══════════════════════════════════════════
  //  MULTIPLAYER
  // ══════════════════════════════════════════

  socket.on('create-room', ({ name, category }) => {
    let code, tries = 0;
    do { code = generateCode(); tries++; } while (rooms.has(code) && tries < 50);

    const room = {
      code, category,
      players: [{ socketId: socket.id, name: name.trim(), role: 'picker' }],
      status: 'waiting',
      movie: '', blanks: [], guessedLetters: [], wrongGuesses: 0,
      hintUsed: false, hint: '', round: 1, maxRounds: MAX_ROUNDS,
      scores: {},       // { playerName: totalPoints }
      roundHistory: []  // completed round summaries
    };

    rooms.set(code, room);
    socket.join(code);
    console.log(`🏠 Room ${code} created by ${name}`);

    socket.emit('room-created', {
      code, category, playerName: name.trim(), role: 'picker',
      players: [{ name: name.trim(), role: 'picker' }],
      maxRounds: MAX_ROUNDS
    });
  });

  socket.on('join-room', ({ name, code }) => {
    const upperCode = code.toUpperCase().trim();
    const room = rooms.get(upperCode);

    if (!room)                    return socket.emit('error', { message: 'Room not found. Check the code.' });
    if (room.players.length >= 2) return socket.emit('error', { message: 'Room is full.' });
    if (room.status !== 'waiting') return socket.emit('error', { message: 'Game already in progress.' });

    let playerName = name.trim();
    if (room.players[0]?.name === playerName) playerName += '_2';

    room.players.push({ socketId: socket.id, name: playerName, role: 'guesser' });
    room.status = 'picking';

    socket.join(upperCode);
    const allPlayers = room.players.map(p => ({ name: p.name, role: p.role }));
    console.log(`👥 ${playerName} joined room ${upperCode}`);

    socket.emit('room-joined', {
      code: upperCode, category: room.category, playerName, role: 'guesser',
      players: allPlayers, maxRounds: MAX_ROUNDS
    });

    io.to(upperCode).emit('game-ready', {
      players: allPlayers, category: room.category, code: upperCode, maxRounds: MAX_ROUNDS
    });
  });

  socket.on('submit-movie', ({ code, movie, isRandom }) => {
    const room = rooms.get(code);
    if (!room || room.status !== 'picking') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.role !== 'picker') return;

    const movieTitle = isRandom ? getRandomMovie(room.category) : movie.trim().toUpperCase();
    if (!movieTitle || movieTitle.replace(/\s/g, '').length < 2)
      return socket.emit('error', { message: 'Movie title too short.' });

    room.movie        = movieTitle;
    room.blanks       = movieToBlanks(movieTitle);
    room.guessedLetters = [];
    room.wrongGuesses = 0;
    room.hintUsed     = false;
    room.hint         = '';
    room.status       = 'playing';

    const info   = getMovieInfo(movieTitle);
    const picker = room.players.find(p => p.role === 'picker');
    const guesser = room.players.find(p => p.role === 'guesser');

    io.to(picker.socketId).emit('game-start', {
      blanks: movieTitle.split(''), movie: movieTitle, info, isPickerView: true
    });
    if (guesser) {
      io.to(guesser.socketId).emit('game-start', {
        blanks: room.blanks, info, isPickerView: false
      });
    }
  });

  socket.on('guess-letter', ({ code, letter }) => {
    const room = rooms.get(code);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.role !== 'guesser') return;

    const L = letter.toUpperCase();
    if (room.guessedLetters.includes(L)) return;

    room.guessedLetters.push(L);
    const isCorrect = room.movie.includes(L);
    if (isCorrect) room.blanks = revealLetters(room.blanks, room.movie, L);
    else           room.wrongGuesses += 1;

    const won  = isWon(room.blanks);
    const lost = room.wrongGuesses >= MAX_WRONG;

    let scoreInfo = null;
    if (won || lost) {
      room.status = 'ended';
      scoreInfo = finalizeRound(room, won);
    }

    io.to(code).emit('guess-result', {
      letter: L, isCorrect, blanks: room.blanks,
      guessedLetters: room.guessedLetters, wrongGuesses: room.wrongGuesses,
      won, lost, movie: (won || lost) ? room.movie : undefined,
      ...(scoreInfo ? {
        scores: room.scores, roundHistory: room.roundHistory,
        guesserDelta: scoreInfo.guesserDelta, pickerDelta: scoreInfo.pickerDelta,
        badge: scoreInfo.badge, isMatchOver: room.round >= room.maxRounds
      } : {})
    });
  });

  socket.on('guess-movie', ({ code, guess }) => {
    const room = rooms.get(code);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.role !== 'guesser') return;

    const isCorrect = guess.trim().toUpperCase() === room.movie;

    if (isCorrect) {
      room.blanks  = room.movie.split('');
      room.status  = 'ended';
      const scoreInfo = finalizeRound(room, true);
      io.to(code).emit('guess-result', {
        blanks: room.blanks, guessedLetters: room.guessedLetters,
        wrongGuesses: room.wrongGuesses, won: true, lost: false,
        movie: room.movie, fullGuess: true,
        scores: room.scores, roundHistory: room.roundHistory,
        guesserDelta: scoreInfo.guesserDelta, pickerDelta: scoreInfo.pickerDelta,
        badge: scoreInfo.badge, isMatchOver: room.round >= room.maxRounds
      });
    } else {
      room.wrongGuesses += 1;
      const lost = room.wrongGuesses >= MAX_WRONG;
      if (lost) room.status = 'ended';

      let scoreInfo = null;
      if (lost) scoreInfo = finalizeRound(room, false);

      io.to(code).emit('guess-result', {
        blanks: room.blanks, guessedLetters: room.guessedLetters,
        wrongGuesses: room.wrongGuesses, won: false, lost,
        movie: lost ? room.movie : undefined, wrongFullGuess: true,
        wrongGuess: guess.trim().toUpperCase(),
        ...(scoreInfo ? {
          scores: room.scores, roundHistory: room.roundHistory,
          guesserDelta: scoreInfo.guesserDelta, pickerDelta: scoreInfo.pickerDelta,
          badge: scoreInfo.badge, isMatchOver: room.round >= room.maxRounds
        } : {})
      });
    }
  });

  socket.on('give-hint', ({ code, hint }) => {
    const room = rooms.get(code);
    if (!room || room.hintUsed || room.status !== 'playing') return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.role !== 'picker') return;
    room.hintUsed = true;
    room.hint = hint.trim();
    io.to(code).emit('hint-received', { hint: room.hint });
  });

  socket.on('chat-message', ({ code, name, message }) => {
    if (!message?.trim() || !code) return;
    io.to(code).emit('chat-broadcast', {
      name, message: message.trim(), timestamp: Date.now(), isReaction: false
    });
  });

  // Quick emoji reaction — broadcasts to whole room
  socket.on('emoji-reaction', ({ code, name, emoji }) => {
    if (!code || !emoji) return;
    io.to(code).emit('emoji-reaction', { name, emoji, timestamp: Date.now() });
  });

  // Typing indicator — relay to other players
  socket.on('typing', ({ code, name }) => {
    if (!code) return;
    socket.to(code).emit('user-typing', { name });
  });

  // Play again — next round OR match over
  socket.on('play-again', ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;

    if (room.round >= room.maxRounds) {
      // Match is fully over — find winner
      const [p1, p2] = room.players;
      const s1 = room.scores[p1.name] || 0;
      const s2 = room.scores[p2.name] || 0;
      const winner = s1 > s2 ? p1.name : s2 > s1 ? p2.name : null;
      io.to(code).emit('match-ended', {
        scores: room.scores, roundHistory: room.roundHistory, winner
      });
      return;
    }

    // Swap roles, start next round
    room.players = room.players.map(p => ({
      ...p, role: p.role === 'picker' ? 'guesser' : 'picker'
    }));
    room.status = 'picking';
    room.movie  = ''; room.blanks = []; room.guessedLetters = [];
    room.wrongGuesses = 0; room.hintUsed = false; room.hint = '';
    room.round += 1;

    io.to(code).emit('new-round', {
      players: room.players.map(p => ({ name: p.name, role: p.role })),
      round: room.round, category: room.category, maxRounds: room.maxRounds,
      scores: room.scores, roundHistory: room.roundHistory
    });
  });

  // ══════════════════════════════════════════
  //  VS COMPUTER  (player = guesser, CPU = picker)
  // ══════════════════════════════════════════

  socket.on('start-vs-computer', ({ name, category }) => {
    const movie = getRandomMovie(category);
    const gs = {
      category, movie, blanks: movieToBlanks(movie),
      guessedLetters: [], wrongGuesses: 0, hintUsed: false,
      status: 'playing', playerName: name, round: 1,
      scores: { [name]: 0 }, roundHistory: []
    };
    computerGames.set(socket.id, gs);
    console.log(`🤖 VS CPU: ${name} [${category}]`);

    socket.emit('computer-game-start', {
      blanks: gs.blanks, info: getMovieInfo(movie), status: 'playing',
      scores: gs.scores, round: 1, maxRounds: MAX_ROUNDS
    });
  });

  socket.on('computer-guess-letter', ({ letter }) => {
    const gs = computerGames.get(socket.id);
    if (!gs || gs.status !== 'playing') return;

    const L = letter.toUpperCase();
    if (gs.guessedLetters.includes(L)) return;

    gs.guessedLetters.push(L);
    const isCorrect = gs.movie.includes(L);
    if (isCorrect) gs.blanks = revealLetters(gs.blanks, gs.movie, L);
    else           gs.wrongGuesses += 1;

    const won  = isWon(gs.blanks);
    const lost = gs.wrongGuesses >= MAX_WRONG;

    let scoreInfo = null;
    if (won || lost) {
      gs.status = 'ended';
      const delta = calcGuesserDelta(won, gs.wrongGuesses);
      gs.scores[gs.playerName] = (gs.scores[gs.playerName] || 0) + delta;
      const badge = performanceBadge(won, gs.wrongGuesses);
      gs.roundHistory.push({
        round: gs.round, movie: gs.movie, won,
        wrongGuesses: gs.wrongGuesses, guesserDelta: delta, badge
      });
      scoreInfo = { delta, badge };
    }

    socket.emit('computer-guess-result', {
      letter: L, isCorrect, blanks: gs.blanks,
      guessedLetters: gs.guessedLetters, wrongGuesses: gs.wrongGuesses,
      won, lost, movie: (won || lost) ? gs.movie : undefined,
      ...(scoreInfo ? {
        scores: gs.scores, roundHistory: gs.roundHistory,
        guesserDelta: scoreInfo.delta, badge: scoreInfo.badge,
        isMatchOver: gs.round >= MAX_ROUNDS
      } : {})
    });
  });

  socket.on('computer-guess-movie', ({ guess }) => {
    const gs = computerGames.get(socket.id);
    if (!gs || gs.status !== 'playing') return;

    const isCorrect = guess.trim().toUpperCase() === gs.movie;
    if (isCorrect) {
      gs.blanks  = gs.movie.split('');
      gs.status  = 'ended';
      const delta = calcGuesserDelta(true, gs.wrongGuesses);
      gs.scores[gs.playerName] = (gs.scores[gs.playerName] || 0) + delta;
      const badge = performanceBadge(true, gs.wrongGuesses);
      gs.roundHistory.push({
        round: gs.round, movie: gs.movie, won: true,
        wrongGuesses: gs.wrongGuesses, guesserDelta: delta, badge
      });
      socket.emit('computer-guess-result', {
        blanks: gs.blanks, guessedLetters: gs.guessedLetters,
        wrongGuesses: gs.wrongGuesses, won: true, lost: false,
        movie: gs.movie, fullGuess: true,
        scores: gs.scores, roundHistory: gs.roundHistory,
        guesserDelta: delta, badge, isMatchOver: gs.round >= MAX_ROUNDS
      });
    } else {
      gs.wrongGuesses += 1;
      const lost = gs.wrongGuesses >= MAX_WRONG;
      if (lost) gs.status = 'ended';

      let scoreInfo = null;
      if (lost) {
        const delta = calcGuesserDelta(false, gs.wrongGuesses);
        gs.scores[gs.playerName] = (gs.scores[gs.playerName] || 0) + delta;
        const badge = performanceBadge(false, gs.wrongGuesses);
        gs.roundHistory.push({
          round: gs.round, movie: gs.movie, won: false,
          wrongGuesses: gs.wrongGuesses, guesserDelta: delta, badge
        });
        scoreInfo = { delta, badge };
      }

      socket.emit('computer-guess-result', {
        blanks: gs.blanks, guessedLetters: gs.guessedLetters,
        wrongGuesses: gs.wrongGuesses, won: false, lost,
        movie: lost ? gs.movie : undefined, wrongFullGuess: true,
        wrongGuess: guess.trim().toUpperCase(),
        ...(scoreInfo ? {
          scores: gs.scores, roundHistory: gs.roundHistory,
          guesserDelta: scoreInfo.delta, badge: scoreInfo.badge,
          isMatchOver: gs.round >= MAX_ROUNDS
        } : {})
      });
    }
  });

  socket.on('computer-give-hint', () => {
    const gs = computerGames.get(socket.id);
    if (!gs || gs.hintUsed || gs.status !== 'playing') return;
    gs.hintUsed = true;
    socket.emit('computer-hint-received', { hint: generateAutoHint(gs.blanks, gs.movie) });
  });

  socket.on('computer-play-again', ({ category, name }) => {
    const gs = computerGames.get(socket.id);
    if (!gs) return;

    if (gs.round >= MAX_ROUNDS) {
      // Match over
      socket.emit('computer-match-ended', {
        scores: gs.scores, roundHistory: gs.roundHistory,
        totalScore: gs.scores[gs.playerName] || 0
      });
      return;
    }

    const movie = getRandomMovie(category || gs.category);
    gs.movie = movie; gs.blanks = movieToBlanks(movie);
    gs.guessedLetters = []; gs.wrongGuesses = 0; gs.hintUsed = false;
    gs.status = 'playing'; gs.round += 1;

    socket.emit('computer-new-round', {
      blanks: gs.blanks, info: getMovieInfo(movie), status: 'playing',
      scores: gs.scores, round: gs.round, maxRounds: MAX_ROUNDS
    });
  });

  // ══════════════════════════════════════════
  //  DISCONNECT
  // ══════════════════════════════════════════

  socket.on('disconnect', () => {
    computerGames.delete(socket.id);
    for (const [code, room] of rooms) {
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) {
        if (['waiting', 'picking', 'playing'].includes(room.status)) {
          room.status = 'ended';
          socket.to(code).emit('player-left', { message: 'Your opponent disconnected.' });
        }
        if (room.players.length === 1 || room.status === 'waiting') rooms.delete(code);
        break;
      }
    }
  });
};

import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

const GameContext = createContext(null);

const initialState = {
  playerName: '',
  category: 'hollywood',
  role: null,
  roomCode: '',
  gameMode: null,
  gameStatus: 'idle',
  players: [],
  blanks: [],
  movie: '',
  movieInfo: null,
  guessedLetters: [],
  wrongGuesses: 0,
  hintUsed: false,
  hint: '',
  messages: [],
  result: null,
  error: '',
  round: 1,
  maxRounds: 6,
  wrongFullGuess: false,
  wrongGuessText: '',
  // Scoring
  scores: {},          // { playerName: totalPts }
  roundHistory: [],    // array of completed rounds
  guesserDelta: null,  // points gained/lost this round
  pickerDelta: null,
  badge: null,         // { label, emoji } performance badge
  isMatchOver: false,
  matchWinner: null,
  // Real-time
  typingPlayer: null,  // name of player currently typing
  floatingEmojis: [],  // [{ id, emoji, name }] for animation
};

function reducer(state, action) {
  switch (action.type) {

    case 'SET_NAME':     return { ...state, playerName: action.payload };
    case 'SET_ERROR':    return { ...state, error: action.payload };
    case 'CLEAR_WRONG_GUESS': return { ...state, wrongFullGuess: false, wrongGuessText: '' };
    case 'CLEAR_DELTA':  return { ...state, guesserDelta: null, pickerDelta: null, badge: null };
    case 'SET_TYPING':   return { ...state, typingPlayer: action.payload };
    case 'CLEAR_TYPING': return { ...state, typingPlayer: null };

    case 'ADD_EMOJI': {
      const id = Date.now() + Math.random();
      return { ...state, floatingEmojis: [...state.floatingEmojis, { id, ...action.payload }] };
    }
    case 'REMOVE_EMOJI':
      return { ...state, floatingEmojis: state.floatingEmojis.filter(e => e.id !== action.payload) };

    case 'ROOM_CREATED':
      return {
        ...state, error: '', messages: [],
        roomCode: action.payload.code,
        playerName: action.payload.playerName,
        role: 'picker',
        gameMode: 'multiplayer',
        gameStatus: 'lobby',
        players: action.payload.players || [],
        category: action.payload.category,
        maxRounds: action.payload.maxRounds || 6,
        scores: {}, roundHistory: [], round: 1
      };

    case 'ROOM_JOINED':
      return {
        ...state, error: '', messages: [],
        roomCode: action.payload.code,
        playerName: action.payload.playerName,
        role: 'guesser',
        gameMode: 'multiplayer',
        gameStatus: 'lobby',
        players: action.payload.players || [],
        category: action.payload.category,
        maxRounds: action.payload.maxRounds || 6,
        scores: {}, roundHistory: [], round: 1
      };

    case 'GAME_READY':
      return {
        ...state,
        players: action.payload.players,
        maxRounds: action.payload.maxRounds || state.maxRounds,
        gameStatus: 'picking',
        error: ''
      };

    case 'GAME_START':
      return {
        ...state,
        blanks: action.payload.blanks,
        movie: action.payload.movie || '',
        movieInfo: action.payload.info,
        gameStatus: 'playing',
        guessedLetters: [], wrongGuesses: 0,
        hintUsed: false, hint: '',
        result: null, wrongFullGuess: false, wrongGuessText: '',
        guesserDelta: null, pickerDelta: null, badge: null, isMatchOver: false
      };

    case 'GUESS_RESULT': {
      const { won, lost, blanks, guessedLetters, wrongGuesses, movie,
              wrongFullGuess, wrongGuess, scores, roundHistory,
              guesserDelta, pickerDelta, badge, isMatchOver } = action.payload;
      return {
        ...state,
        blanks:         blanks        ?? state.blanks,
        guessedLetters: guessedLetters ?? state.guessedLetters,
        wrongGuesses:   wrongGuesses  ?? state.wrongGuesses,
        gameStatus:     (won || lost) ? 'ended' : 'playing',
        result:         won ? 'won' : lost ? 'lost' : null,
        movie:          movie || state.movie,
        wrongFullGuess: wrongFullGuess || false,
        wrongGuessText: wrongGuess || '',
        scores:         scores        ?? state.scores,
        roundHistory:   roundHistory  ?? state.roundHistory,
        guesserDelta:   guesserDelta  ?? state.guesserDelta,
        pickerDelta:    pickerDelta   ?? state.pickerDelta,
        badge:          badge         ?? state.badge,
        isMatchOver:    isMatchOver   ?? state.isMatchOver
      };
    }

    case 'HINT_RECEIVED':
      return { ...state, hint: action.payload.hint, hintUsed: true };

    case 'CHAT_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };

    case 'NEW_ROUND': {
      const myRole = action.payload.players.find(p => p.name === state.playerName)?.role || state.role;
      return {
        ...state,
        players: action.payload.players,
        round: action.payload.round,
        maxRounds: action.payload.maxRounds || state.maxRounds,
        role: myRole,
        gameStatus: 'picking',
        blanks: [], movie: '', movieInfo: null,
        guessedLetters: [], wrongGuesses: 0,
        hintUsed: false, hint: '',
        result: null, wrongFullGuess: false, wrongGuessText: '',
        guesserDelta: null, pickerDelta: null, badge: null,
        isMatchOver: false, error: '',
        scores: action.payload.scores ?? state.scores,
        roundHistory: action.payload.roundHistory ?? state.roundHistory
      };
    }

    case 'MATCH_ENDED':
      return {
        ...state,
        isMatchOver: true,
        matchWinner: action.payload.winner,
        scores: action.payload.scores,
        roundHistory: action.payload.roundHistory
      };

    case 'COMPUTER_START':
      return {
        ...state,
        gameMode: 'computer', role: 'guesser', gameStatus: 'playing',
        blanks: action.payload.blanks || [],
        movieInfo: action.payload.info || null,
        category: action.payload.category || state.category,
        guessedLetters: [], wrongGuesses: 0,
        hintUsed: false, hint: '', result: null, movie: '',
        error: '', players: [], messages: [],
        wrongFullGuess: false, wrongGuessText: '',
        guesserDelta: null, pickerDelta: null, badge: null,
        isMatchOver: false, matchWinner: null,
        round: action.payload.round || 1,
        maxRounds: action.payload.maxRounds || 6,
        scores: action.payload.scores || {},
        roundHistory: []
      };

    case 'COMPUTER_NEW_ROUND':
      return {
        ...state,
        gameStatus: 'playing',
        blanks: action.payload.blanks || [],
        movieInfo: action.payload.info || null,
        guessedLetters: [], wrongGuesses: 0,
        hintUsed: false, hint: '', result: null, movie: '',
        wrongFullGuess: false, wrongGuessText: '',
        guesserDelta: null, pickerDelta: null, badge: null,
        isMatchOver: false,
        round: action.payload.round || state.round + 1,
        scores: action.payload.scores || state.scores,
        maxRounds: action.payload.maxRounds || state.maxRounds
      };

    case 'COMPUTER_MATCH_ENDED':
      return {
        ...state,
        isMatchOver: true,
        matchWinner: null, // vs CPU has no "winner" per se
        scores: action.payload.scores,
        roundHistory: action.payload.roundHistory
      };

    case 'PLAYER_LEFT':
      return { ...state, gameStatus: 'ended', result: null, error: action.payload.message };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    socket.connect();

    // Multiplayer
    socket.on('room-created',   d => { dispatch({ type: 'ROOM_CREATED', payload: d }); navigate('/lobby'); });
    socket.on('room-joined',    d => dispatch({ type: 'ROOM_JOINED',  payload: d }));
    socket.on('game-ready',     d => { dispatch({ type: 'GAME_READY', payload: d }); navigate('/game'); });
    socket.on('game-start',     d => dispatch({ type: 'GAME_START',  payload: d }));
    socket.on('guess-result',   d => dispatch({ type: 'GUESS_RESULT', payload: d }));
    socket.on('hint-received',  d => dispatch({ type: 'HINT_RECEIVED', payload: d }));
    socket.on('chat-broadcast', d => dispatch({ type: 'CHAT_MESSAGE', payload: d }));
    socket.on('new-round',      d => dispatch({ type: 'NEW_ROUND', payload: d }));
    socket.on('match-ended',    d => dispatch({ type: 'MATCH_ENDED', payload: d }));
    socket.on('player-left',    d => dispatch({ type: 'PLAYER_LEFT', payload: d }));
    socket.on('error',          d => dispatch({ type: 'SET_ERROR', payload: d.message }));

    // Emoji reaction
    socket.on('emoji-reaction', ({ name, emoji }) => {
      const id = Date.now() + Math.random();
      dispatch({ type: 'ADD_EMOJI', payload: { id, name, emoji } });
      setTimeout(() => dispatch({ type: 'REMOVE_EMOJI', payload: id }), 2500);
    });

    // Typing indicator
    socket.on('user-typing', ({ name }) => {
      dispatch({ type: 'SET_TYPING', payload: name });
      // auto-clear after 2s
      setTimeout(() => dispatch({ type: 'CLEAR_TYPING' }), 2000);
    });

    // VS Computer
    socket.on('computer-game-start',  d => { dispatch({ type: 'COMPUTER_START', payload: d }); navigate('/game'); });
    socket.on('computer-guess-result',d => dispatch({ type: 'GUESS_RESULT', payload: d }));
    socket.on('computer-hint-received', d => dispatch({ type: 'HINT_RECEIVED', payload: d }));
    socket.on('computer-new-round',   d => dispatch({ type: 'COMPUTER_NEW_ROUND', payload: d }));
    socket.on('computer-match-ended', d => dispatch({ type: 'COMPUTER_MATCH_ENDED', payload: d }));

    return () => {
      socket.off('room-created'); socket.off('room-joined'); socket.off('game-ready');
      socket.off('game-start'); socket.off('guess-result'); socket.off('hint-received');
      socket.off('chat-broadcast'); socket.off('new-round'); socket.off('match-ended');
      socket.off('player-left'); socket.off('error'); socket.off('emoji-reaction');
      socket.off('user-typing');
      socket.off('computer-game-start'); socket.off('computer-guess-result');
      socket.off('computer-hint-received'); socket.off('computer-new-round');
      socket.off('computer-match-ended');
    };
  }, [navigate]);

  const actions = {
    createRoom:     (name, cat) => { dispatch({ type: 'SET_NAME', payload: name }); socket.emit('create-room', { name, category: cat }); },
    joinRoom:       (name, code) => { dispatch({ type: 'SET_NAME', payload: name }); socket.emit('join-room', { name, code }); },
    startVsComputer:(name, cat)  => { dispatch({ type: 'SET_NAME', payload: name }); socket.emit('start-vs-computer', { name, category: cat }); },

    submitMovie: (movie, isRandom = false) => {
      socket.emit('submit-movie', { code: stateRef.current.roomCode, movie, isRandom });
    },

    guessLetter: (letter) => {
      const { roomCode, gameMode } = stateRef.current;
      gameMode === 'multiplayer'
        ? socket.emit('guess-letter',          { code: roomCode, letter })
        : socket.emit('computer-guess-letter', { letter });
    },

    guessMovie: (guess) => {
      const { roomCode, gameMode } = stateRef.current;
      gameMode === 'multiplayer'
        ? socket.emit('guess-movie',          { code: roomCode, guess })
        : socket.emit('computer-guess-movie', { guess });
    },

    giveHint: (hint) => {
      const { roomCode, gameMode } = stateRef.current;
      gameMode === 'multiplayer'
        ? socket.emit('give-hint',          { code: roomCode, hint })
        : socket.emit('computer-give-hint');
    },

    sendChat: (message) => {
      const { roomCode, playerName } = stateRef.current;
      socket.emit('chat-message', { code: roomCode, name: playerName, message });
    },

    sendEmojiReaction: (emoji) => {
      const { roomCode, playerName } = stateRef.current;
      socket.emit('emoji-reaction', { code: roomCode, name: playerName, emoji });
      // Show locally too
      const id = Date.now() + Math.random();
      dispatch({ type: 'ADD_EMOJI', payload: { id, name: playerName, emoji } });
      setTimeout(() => dispatch({ type: 'REMOVE_EMOJI', payload: id }), 2500);
    },

    sendTyping: () => {
      const { roomCode, playerName } = stateRef.current;
      if (roomCode) socket.emit('typing', { code: roomCode, name: playerName });
    },

    playAgain: () => {
      const { roomCode, gameMode, category, playerName } = stateRef.current;
      gameMode === 'multiplayer'
        ? socket.emit('play-again',          { code: roomCode })
        : socket.emit('computer-play-again', { category, name: playerName });
    },

    clearError:     () => dispatch({ type: 'SET_ERROR', payload: '' }),
    clearWrongGuess:() => dispatch({ type: 'CLEAR_WRONG_GUESS' }),
    resetGame:      () => dispatch({ type: 'RESET' })
  };

  return <GameContext.Provider value={{ state, actions }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

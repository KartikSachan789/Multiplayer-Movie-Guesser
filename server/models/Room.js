const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['picker', 'guesser'], required: true }
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  category: { type: String, enum: ['hollywood', 'bollywood'], required: true },
  players: [PlayerSchema],
  status: {
    type: String,
    enum: ['waiting', 'picking', 'playing', 'ended'],
    default: 'waiting'
  },
  movie: { type: String, default: '' },
  blanks: [{ type: String }],
  guessedLetters: [{ type: String }],
  wrongGuesses: { type: Number, default: 0 },
  hintUsed: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  round: { type: Number, default: 1 }
}, { timestamps: true });

// Auto-clean ended rooms after 24 hours
RoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Room', RoomSchema);

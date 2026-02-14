const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const pollSchema = new mongoose.Schema(
  {
    pollId: {
      type: String,
      default: () => uuidv4(),
      required: true,
      unique: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
    options: [
      {
        optionId: {
          type: String,
          default: () => uuidv4(),
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
          minlength: 1,
          maxlength: 200,
        },
        votes: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalVotes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        voterId: String, // fingerprint or session id
        ipHash: String, // hashed IP address
        timestamp: Date,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  },
  { timestamps: true }
);

// TTL Index for auto-deletion (optional)
pollSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Poll', pollSchema);

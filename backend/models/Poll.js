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
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    questions: [
      {
        questionId: {
          type: String,
          default: () => uuidv4(),
          required: true,
        },
        text: {
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
      },
    ],
    voters: [
      {
        voterId: String, // fingerprint or session id
        ipHash: String, // hashed IP address
        questionsVoted: [String], // Array of questionIds that this voter has voted on
        timestamp: Date,
      },
    ],
    totalVotes: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Poll', pollSchema);

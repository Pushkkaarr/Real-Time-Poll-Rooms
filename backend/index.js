require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
const connectDB = require('./config/database');
const { generalLimiter } = require('./middleware/rateLimiter');
const pollRoutes = require('./routes/polls');
const Poll = require('./models/Poll');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Real-Time Polling API',
    version: '2.0.0',
    features: 'Multiple questions per poll, results shown only after voting all questions',
    endpoints: {
      createPoll: 'POST /api/polls',
      getPoll: 'GET /api/polls/:pollId',
      voteOnPoll: 'POST /api/polls/:pollId/vote',
      deletePoll: 'DELETE /api/polls/:pollId',
      getAllPolls: 'GET /api/polls',
    },
  });
});

app.use('/api/polls', pollRoutes);

// Initialize Socket.io in poll routes for broadcasting
const pollRoutesModule = require('./routes/polls');
pollRoutesModule.initializeIO(io);

// WebSocket Connection Handling
io.on('connection', (socket) => {
  // Join a poll room
  socket.on('join-poll', async (pollId) => {
    try {
      socket.join(`poll-${pollId}`);
      const poll = await Poll.findOne({ pollId });
      
      if (poll) {
        // Send current poll state to the new user
        socket.emit('poll-state', {
          pollId: poll.pollId,
          title: poll.title,
          description: poll.description,
          questions: poll.questions.map(q => ({
            questionId: q.questionId,
            text: q.text,
            options: q.options.map(opt => ({
              optionId: opt.optionId,
              text: opt.text,
              votes: opt.votes,
            })),
            totalVotes: q.totalVotes,
          })),
          totalVotes: poll.totalVotes,
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Error joining poll' });
    }
  });

  // Handle new vote
  socket.on('vote-cast', async (data) => {
    try {
      const { pollId } = data;
      const poll = await Poll.findOne({ pollId });

      if (poll) {
        // Broadcast updated poll state to all users in this poll room
        io.to(`poll-${pollId}`).emit('poll-updated', {
          pollId: poll.pollId,
          title: poll.title,
          description: poll.description,
          questions: poll.questions.map(q => ({
            questionId: q.questionId,
            text: q.text,
            options: q.options.map(opt => ({
              optionId: opt.optionId,
              text: opt.text,
              votes: opt.votes,
            })),
            totalVotes: q.totalVotes,
          })),
          totalVotes: poll.totalVotes,
        });
      }
    } catch (error) {
      // Silently handle vote broadcast errors
    }
  });

  // Leave poll room
  socket.on('leave-poll', (pollId) => {
    socket.leave(`poll-${pollId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    // User disconnected
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);

  // Keep-alive ping to prevent Render app from sleeping
  const url = process.env.B_LINK; // Your Render app URL
  const interval = 13 * 60 * 1000; // 13 minutes

  if (url) {
    setInterval(() => {
      axios.get(url)
        .then(response => {
          console.log(`Keep-alive ping at ${new Date().toISOString()}: Status ${response.status}`);
        })
        .catch(error => {
          console.error(`Keep-alive ping error at ${new Date().toISOString()}:`, error.message);
        });
    }, interval);
  }
});

// Export io instance for use in other modules
module.exports = io;

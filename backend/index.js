require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
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
    version: '1.0.0',
    endpoints: {
      createPoll: 'POST /api/polls',
      getPoll: 'GET /api/polls/:pollId',
      voteOnPoll: 'POST /api/polls/:pollId/vote',
      getAllPolls: 'GET /api/polls',
    },
  });
});

app.use('/api/polls', pollRoutes);

// WebSocket Connection Handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a poll room
  socket.on('join-poll', async (pollId) => {
    try {
      socket.join(`poll-${pollId}`);
      const poll = await Poll.findOne({ pollId });
      
      if (poll) {
        // Send current poll state to the new user
        socket.emit('poll-state', {
          pollId: poll.pollId,
          question: poll.question,
          options: poll.options,
          totalVotes: poll.totalVotes,
        });
      }
      
      console.log(`User ${socket.id} joined poll ${pollId}`);
    } catch (error) {
      console.error('Error joining poll:', error);
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
          question: poll.question,
          options: poll.options,
          totalVotes: poll.totalVotes,
        });

        console.log(`Vote update broadcast for poll ${pollId}`);
      }
    } catch (error) {
      console.error('Error broadcasting vote:', error);
    }
  });

  // Leave poll room
  socket.on('leave-poll', (pollId) => {
    socket.leave(`poll-${pollId}`);
    console.log(`User ${socket.id} left poll ${pollId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
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
});

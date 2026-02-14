const Poll = require('../models/Poll');
const { validatePollCreation, validateVote } = require('../utils/validation');
const { generateDeviceFingerprint, hashIpAddress, getClientIp } = require('../utils/antiAbuse');

// Import Socket.io instance for broadcasting votes
let io = null;
exports.setIO = (ioInstance) => {
  io = ioInstance;
};

// Create a new poll
exports.createPoll = async (req, res) => {
  try {
    const { question, options } = req.body;

    // Validate input
    const { error, value } = validatePollCreation({
      question,
      options: options.map((opt) => ({ text: opt })),
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Create poll with options
    const poll = new Poll({
      question,
      options: options.map((text) => ({ text, votes: 0 })),
    });

    await poll.save();

    return res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      pollId: poll.pollId,
      poll: {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
        createdAt: poll.createdAt,
      },
    });
  } catch (error) {
  
    return res.status(500).json({
      success: false,
      message: 'Error creating poll',
      error: error.message,
    });
  }
};

// Get poll by ID
exports.getPoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    if (!pollId) {
      return res.status(400).json({
        success: false,
        message: 'Poll ID is required',
      });
    }

    const poll = await Poll.findOne({ pollId });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    return res.status(200).json({
      success: true,
      poll: {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
        createdAt: poll.createdAt,
      },
    });
  } catch (error) {
   
    return res.status(500).json({
      success: false,
      message: 'Error fetching poll',
      error: error.message,
    });
  }
};

// Vote on a poll
exports.voteOnPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;

    // Validate input
    const { error } = validateVote({ optionId });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    if (!pollId) {
      return res.status(400).json({
        success: false,
        message: 'Poll ID is required',
      });
    }

    // Get client information for anti-abuse mechanisms
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const deviceFingerprint = generateDeviceFingerprint(userAgent, acceptLanguage);
    const clientIp = getClientIp(req);
    const ipHash = hashIpAddress(clientIp);

    // Fetch poll
    const poll = await Poll.findOne({ pollId });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    // ANTI-ABUSE MECHANISM 1: Check if user already voted for THIS SPECIFIC OPTION
    // Allows multiple votes from same device (household/office scenarios)
    // but prevents voting for the same option twice
    const alreadyVotedForThisOption = poll.voters.some(
      (voter) => voter.voterId === deviceFingerprint && voter.optionId === optionId
    );
    if (alreadyVotedForThisOption) {
      return res.status(403).json({
        success: false,
        message: 'You have already voted for this option',
        poll: {
          pollId: poll.pollId,
          question: poll.question,
          options: poll.options,
          totalVotes: poll.totalVotes,
        },
      });
    }

    // ANTI-ABUSE MECHANISM 2: Check IP hash and rate limiting
    // Hashed IPs are tracked to prevent distributed voting attacks
    // Allow up to 3 votes per IP per poll (for household/office scenarios)
    const ipVoteCount = poll.voters.filter((voter) => voter.ipHash === ipHash).length;
    if (ipVoteCount >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many votes from this network. Please try again later',
      });
    }

    // Check if option exists
    const optionIndex = poll.options.findIndex((opt) => opt.optionId === optionId);
    if (optionIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected',
      });
    }

    // Register the vote - atomically increment vote count
    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;
    poll.voters.push({
      voterId: deviceFingerprint,
      optionId: optionId,  // Track which option was voted for
      ipHash: ipHash,
      timestamp: new Date(),
    });

    await poll.save();
    
    // Broadcast vote update to all WebSocket clients in this poll room
    if (io) {
      const updatePayload = {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
      };
      
      io.to(`poll-${pollId}`).emit('poll-updated', updatePayload);
    }

    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      poll: {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
      },
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: 'Error recording vote',
      error: error.message,
    });
  }
};

// Get all polls (for testing/admin purposes)
exports.getAllPolls = async (req, res) => {
  try {
    const polls = await Poll.find({}).select('-voters').limit(100);
    return res.status(200).json({
      success: true,
      count: polls.length,
      polls,
    });
  } catch (error) {
 
    return res.status(500).json({
      success: false,
      message: 'Error fetching polls',
      error: error.message,
    });
  }
};

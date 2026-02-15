const Poll = require('../models/Poll');
const { validatePollCreation, validateVote, validateMultiPollCreation } = require('../utils/validation');
const { generateDeviceFingerprint, hashIpAddress, getClientIp } = require('../utils/antiAbuse');

// Import Socket.io instance for broadcasting votes
let io = null;
exports.setIO = (ioInstance) => {
  io = ioInstance;
};

// Create a new poll with multiple questions
exports.createPoll = async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    // Validate input
    const { error, value } = validateMultiPollCreation({
      title,
      description,
      questions,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Create poll with multiple questions
    const poll = new Poll({
      title,
      description,
      questions: questions.map((q) => ({
        text: q.text,
        options: q.options.map((opt) => ({ text: opt, votes: 0 })),
        totalVotes: 0,
      })),
    });

    await poll.save();

    return res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      pollId: poll.pollId,
      poll: {
        pollId: poll.pollId,
        title: poll.title,
        description: poll.description,
        questions: poll.questions.map(q => ({
          questionId: q.questionId,
          text: q.text,
          options: q.options.map(opt => ({
            optionId: opt.optionId,
            text: opt.text,
            votes: 0,
          })),
        })),
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
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const deviceFingerprint = generateDeviceFingerprint(userAgent, acceptLanguage);

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

    // Find the current voter's record
    const voterRecord = poll.voters.find(v => v.voterId === deviceFingerprint);
    const questionsVoted = voterRecord ? voterRecord.questionsVoted || [] : [];
    const hasVotedAllQuestions = questionsVoted.length === poll.questions.length;

    // Build response based on whether user has voted on all questions
    const questionsResponse = poll.questions.map(q => ({
      questionId: q.questionId,
      text: q.text,
      options: q.options.map(opt => ({
        optionId: opt.optionId,
        text: opt.text,
        votes: hasVotedAllQuestions ? opt.votes : undefined, // Only show votes if voted on all questions
      })),
      totalVotes: hasVotedAllQuestions ? q.totalVotes : undefined,
    }));

    return res.status(200).json({
      success: true,
      hasVotedAllQuestions: hasVotedAllQuestions,
      questionsVoted: questionsVoted,
      poll: {
        pollId: poll.pollId,
        title: poll.title,
        description: poll.description,
        questions: questionsResponse,
        totalVotes: hasVotedAllQuestions ? poll.totalVotes : undefined,
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

// Vote on a specific question in a poll
exports.voteOnPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { questionId, optionId } = req.body;

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

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required',
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

    // Find the question
    const questionIndex = poll.questions.findIndex(q => q.questionId === questionId);
    if (questionIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Question not found in this poll',
      });
    }

    const question = poll.questions[questionIndex];

    // ANTI-ABUSE MECHANISM 1: Check if user already voted for this specific question
    const voterRecord = poll.voters.find(v => v.voterId === deviceFingerprint);
    const hasVotedThisQuestion = voterRecord && voterRecord.questionsVoted.includes(questionId);

    if (hasVotedThisQuestion) {
      return res.status(403).json({
        success: false,
        message: 'You have already voted on this question',
      });
    }

    // ANTI-ABUSE MECHANISM 2: Check IP hash and rate limiting
    const ipVoteCount = poll.voters.filter((voter) => voter.ipHash === ipHash).length;
    if (ipVoteCount >= poll.questions.length * 3) { // Allow 3 votes per question per IP
      return res.status(429).json({
        success: false,
        message: 'Too many votes from this network. Please try again later',
      });
    }

    // Check if option exists
    const optionIndex = question.options.findIndex((opt) => opt.optionId === optionId);
    if (optionIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected',
      });
    }

    // Register the vote
    question.options[optionIndex].votes += 1;
    question.totalVotes += 1;
    poll.totalVotes += 1;

    // Update or create voter record
    if (voterRecord) {
      if (!voterRecord.questionsVoted.includes(questionId)) {
        voterRecord.questionsVoted.push(questionId);
      }
      voterRecord.timestamp = new Date();
    } else {
      poll.voters.push({
        voterId: deviceFingerprint,
        ipHash: ipHash,
        questionsVoted: [questionId],
        timestamp: new Date(),
      });
    }

    await poll.save();

    // Check if user has voted on all questions
    const updatedVoterRecord = poll.voters.find(v => v.voterId === deviceFingerprint);
    const hasVotedAllQuestions = updatedVoterRecord && updatedVoterRecord.questionsVoted.length === poll.questions.length;

    // Build response
    const questionsResponse = poll.questions.map(q => ({
      questionId: q.questionId,
      text: q.text,
      options: q.options.map(opt => ({
        optionId: opt.optionId,
        text: opt.text,
        votes: hasVotedAllQuestions ? opt.votes : undefined,
      })),
      totalVotes: hasVotedAllQuestions ? q.totalVotes : undefined,
    }));

    // Broadcast vote update to all WebSocket clients in this poll room
    if (io) {
      const broadcastPayload = {
        pollId: poll.pollId,
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
      };

      io.to(`poll-${pollId}`).emit('poll-updated', broadcastPayload);
    }

    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      hasVotedAllQuestions: hasVotedAllQuestions,
      questionsVoted: updatedVoterRecord.questionsVoted,
      poll: {
        pollId: poll.pollId,
        title: poll.title,
        description: poll.description,
        questions: questionsResponse,
        totalVotes: hasVotedAllQuestions ? poll.totalVotes : undefined,
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

// Delete a poll
exports.deletePoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    if (!pollId) {
      return res.status(400).json({
        success: false,
        message: 'Poll ID is required',
      });
    }

    const poll = await Poll.findOneAndDelete({ pollId });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found or already deleted',
      });
    }

    // Broadcast poll deletion to all WebSocket clients in this poll room
    if (io) {
      io.to(`poll-${pollId}`).emit('poll-deleted', { pollId });
    }

    return res.status(200).json({
      success: true,
      message: 'Poll and all associated data deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting poll',
      error: error.message,
    });
  }
};

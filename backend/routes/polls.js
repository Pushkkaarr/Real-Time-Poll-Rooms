const router = require('express').Router();
const pollController = require('../controllers/pollController');
const { voteLimiter, pollCreationLimiter } = require('../middleware/rateLimiter');

// Create a new poll
router.post('/', pollCreationLimiter, pollController.createPoll);

// Get poll by ID
router.get('/:pollId', pollController.getPoll);

// Vote on a poll
router.post('/:pollId/vote', voteLimiter, pollController.voteOnPoll);

// Get all polls (for testing)
router.get('/', pollController.getAllPolls);

module.exports = router;

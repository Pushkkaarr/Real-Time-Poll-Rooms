const rateLimit = require('express-rate-limit');

// General rate limiter for all requests
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again after 15 seconds',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  },
});

// Rate limiter for voting endpoint
const voteLimiter = rateLimit({
  windowMs: parseInt(process.env.VOTE_RATE_LIMIT_WINDOW_MS) || 1000,
  max: parseInt(process.env.VOTE_RATE_LIMIT_MAX_REQUESTS) || 1,
  message: 'You are voting too fast. Please wait before voting again',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting for GET requests
    return req.method === 'GET';
  },
});

// Rate limiter for poll creation
const pollCreationLimiter = rateLimit({
  windowMs: parseInt(process.env.POLL_CREATION_RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.POLL_CREATION_RATE_LIMIT_MAX_REQUESTS) || 10,
  message: 'Too many polls created. Please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  voteLimiter,
  pollCreationLimiter,
};

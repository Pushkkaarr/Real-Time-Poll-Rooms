# Real-Time Polling Application

A production-grade, full-stack real-time polling application built with **Express.js + MongoDB** (backend) and **Next.js + Shadcn UI** (frontend). Users can create polls with unique shareable links, vote in real-time, and see instant results across all connected clients.

## Features

✨ **Core Functionality**
- Create polls with custom questions and 2-10 options
- Unique, auto-generated poll IDs
- Persistent polls accessible via shareable links indefinitely
- Real-time vote updates via WebSocket connection
- Vote results visible only after voting
- One vote per user per poll (enforced by anti-abuse mechanisms)

🛡️ **Security & Fairness**
- Two distinct anti-abuse mechanisms prevent repeat voting and malicious behavior
- Rate limiting on voting and poll creation endpoints
- Input validation on all endpoints
- Secure IP hashing for privacy
- No authentication required - accessible to everyone

🎨 **User Experience**
- Modern, responsive UI built with Shadcn components
- Beautiful gradient design with smooth animations
- Live connection indicator showing WebSocket status
- Copy-to-clipboard functionality for sharing polls
- Real-time vote count updates without page refresh
- Graceful error handling with user-friendly messages

📊 **Real-Time Updates**
- WebSocket-based communication via Socket.io
- Instant vote propagation to all connected users
- Late joiners receive current poll state
- Proper connection/disconnection handling

## Anti-Abuse Mechanisms

### Mechanism 1: Device Fingerprinting (Primary Defense)
**What it prevents**: Local repeat voting from the same device/browser

**How it works**:
- Generates a SHA-256 hash from the user's User-Agent and Accept-Language headers
- This fingerprint is stored with each vote in the database
- On subsequent attempts to vote, the backend checks if this fingerprint already exists for the poll
- If found, the vote is rejected with message: "You have already voted on this poll"

**Implementation**:
```javascript
// In antiAbuse.js
const generateDeviceFingerprint = (userAgent, acceptLanguage) => {
  const fingerprint = `${userAgent}:${acceptLanguage}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};
```

**Limitations**:
- Can be bypassed by clearing browser data (localStorage, cookies) and using different device/browser
- Doesn't prevent voting from different devices on the same LAN

**Threat vector addressed**: Casual/accidental repeat voting from the same device

---

### Mechanism 2: IP-Based Rate Limiting with Hashing (Defense in Depth)
**What it prevents**: Distributed attacks from multiple accounts on the same network

**How it works**:
- Hashes the client's IP address using SHA-256 for privacy
- Stores the hashed IP with each vote in the database
- Limits each IP to maximum 3 votes per poll
- The 3-vote allowance accommodates shared networks (households, offices, schools)
- Provides additional express-rate-limit middleware at the HTTP level (1 vote per 1000ms per IP)

**Implementation**:
```javascript
// antiAbuse.js
const hashIpAddress = (ipAddress) => {
  return crypto.createHash('sha256').update(ipAddress).digest('hex');
};

// pollController.js - check IP vote count
const ipVoteCount = poll.voters.filter((voter) => voter.ipHash === ipHash).length;
if (ipVoteCount >= 3) {
  return res.status(429).json({
    success: false,
    message: 'Too many votes from this network. Please try again later',
  });
}
```

**Limitations**:
- Can be bypassed using VPN, proxy, or changing network
- Shared networks can only have 3 votes per poll (by design)
- IP spoofing is possible for attackers with advanced knowledge
- May occasionally block legitimate users behind NAT/proxies

**Threat vector addressed**: Distributed attacks from the same subnet/network, coordinated padding of results

---

## Edge Cases Handled

1. **Late Joiners**: Users joining after votes are cast receive the current poll state via the poll-state event
2. **Simultaneous Votes**: MongoDB atomic operations prevent race conditions
3. **WebSocket Reconnection**: Automatic reconnection with exponential backoff (max 5 attempts)
4. **Stale Data**: Users receive fresh poll state after voting
5. **Invalid Poll IDs**: 404 response with user-friendly error message
6. **Disconnections**: Graceful handling of dropped connections without data loss
7. **Network Issues**: Axios timeout set to 10 seconds; WebSocket reconnection attempts
8. **IP Detection**: Handles X-Forwarded-For and X-Real-IP headers for proxy scenarios
9. **Empty Questions**: Validation requires 5-500 characters
10. **Concurrent Requests**: Database indexes prevent duplicate poll IDs

## API Endpoints

### GET /
Health check endpoint returning API documentation

### POST /api/polls
Create a new poll
```json
{
  "question": "What's your favorite programming language?",
  "options": ["JavaScript", "Python", "Rust", "Go"]
}
```
**Rate Limited**: 10 polls per minute per IP
**Response**: `{ success: true, pollId, poll }`

### GET /api/polls/:pollId
Retrieve poll details and current vote counts
**Response**: `{ success: true, poll }`

### POST /api/polls/:pollId/vote
Vote on a poll
```json
{
  "optionId": "uuid-of-option"
}
```
**Rate Limited**: 1 vote per second per IP
**Anti-Abuse Checks**: Device fingerprint + IP rate limiting
**Response**: `{ success: true, poll }` or error if already voted

### GET /api/polls (Testing)
Retrieve all polls (without voter data)
**Note**: Returns max 100 polls for testing purposes

## Setup & Installation

### Backend Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Configure environment variables** (`.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/polling-app
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_secret_key
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100
VOTE_RATE_LIMIT_WINDOW_MS=1000
VOTE_RATE_LIMIT_MAX_REQUESTS=1
POLL_CREATION_RATE_LIMIT_WINDOW_MS=60000
POLL_CREATION_RATE_LIMIT_MAX_REQUESTS=10
```

3. **Start the server**:
```bash
npm run dev    # Development with nodemon
npm start      # Production
```

Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure environment variables** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:5000
```

3. **Start development server**:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

4. **Build for production**:
```bash
npm run build
npm start
```

## Usage

1. **Create a Poll**:
   - Navigate to `http://localhost:3000`
   - Enter a question and 2-10 options
   - Click "Create Poll"

2. **Share the Poll**:
   - Get the shareable link from the poll page
   - Share via link, email, social media, etc.

3. **Vote**:
   - Open the poll link
   - Click on an option to vote
   - See results update in real-time as others vote

4. **View Results**:
   - Results are visible to you after you vote
   - Number of votes and percentages display for each option
   - Watch the live indicator to see connection status

### Database Persistence

All polls and votes are persisted in MongoDB:
- Polls never expire (TTL set to 1 year)
- Voter information stored with timestamps
- Supports horizontal scaling with MongoDB replica sets

## Known Limitations & Improvements

### Current Limitations

1. **No User Accounts**: Can't track actual users, only devices/IPs
   - *Improvement*: Add optional email verification or OAuth

2. **IP Detection**:Private networks might show same IP (NAT)
   - *Improvement*: Add optional CAPTCHA for additional verification

3. **WebSocket Overhead**: Real-time updates require persistent connection
   - *Improvement*: Implement Server-Sent Events as fallback for polling

4. **Limited Poll Analytics**: Only vote counts stored, no demographics
   - *Improvement*: Add optional demographic collection (age, location, etc.)

5. **No Poll Moderation**: Anyone can create any poll
   - *Improvement*: Add content filtering, report abuse system

6. **Browser Data Required**: Device fingerprinting depends on browser headers
   - *Improvement*: Add localStorage-based session tokens for stronger tracking

### Potential Enhancements

- Add poll categories and search functionality
- Implement poll expiration with notification system
- Add comment/discussion feature on polls
- Implement emoji reactions to options
- Add poll templates for common questions
- Create admin dashboard to view all polls
- Add optional password protection for polls
- Implement poll cloning feature
- Add poll scheduling (set to start/end at specific times)
- Create mobile apps for iOS/Android



**Built with ❤️ for production-grade polling**

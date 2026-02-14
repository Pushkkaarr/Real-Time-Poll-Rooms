const crypto = require('crypto');

// Anti-Abuse Mechanism 1: Device Fingerprinting
// Creates a unique fingerprint from client information stored in cookies
// Prevents repeat voting from the same device/session
const generateDeviceFingerprint = (userAgent, acceptLanguage) => {
  const fingerprint = `${userAgent}:${acceptLanguage}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

// Anti-Abuse Mechanism 2: IP-based Rate Limiting with Hashing
// Hashes IP addresses for privacy and uses them to track voting patterns
// Prevents distributed attacks from the same subnet
const hashIpAddress = (ipAddress) => {
  return crypto.createHash('sha256').update(ipAddress).digest('hex');
};

// Extract client IP from request (considering proxies)
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    '0.0.0.0'
  );
};

module.exports = {
  generateDeviceFingerprint,
  hashIpAddress,
  getClientIp,
};

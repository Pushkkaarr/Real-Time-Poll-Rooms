// Generate device fingerprint matching backend logic
// This allows frontend to detect if current device has already voted

export const generateDeviceFingerprint = async (): Promise<string> => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const acceptLanguage = typeof navigator !== 'undefined' ? navigator.language : '';
  
  const fingerprint = `${userAgent}:${acceptLanguage}`;
  
  // Use SubtleCrypto for SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

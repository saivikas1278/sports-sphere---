import rateLimit from 'express-rate-limit';

/**
 * Rate limit broadcasts to 10 per hour per tournament
 */
export const tournamentBroadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => {
    return req.params.id ? `tournament_broadcast_${req.params.id}` : (req.ip || 'global');
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Broadcast rate limit reached: maximum 10 broadcasts per hour per tournament.'
  },
  skip: (req) => {
    // Allows explicit rate-limit bypass in non-rate-limit test runs if header provided
    return process.env.NODE_ENV === 'test' && req.headers['x-skip-rate-limit'] === 'true';
  }
});

// src/middleware/rateLimiter.js
import logger from '../utils/logger.js';

/**
 * Simple in-memory rate limiter.
 * @param {Object} opts
 * @param {number} opts.windowMs - Time window in milliseconds (default: 60000)
 * @param {number} opts.max - Max requests per window (default: 60)
 */
export default function rateLimiter({ windowMs = 60000, max = 60 } = {}) {
  const requests = new Map();

  // Cleanup old entries every window
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests) {
      if (now - data.start > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = requests.get(key);

    if (!record || now - record.start > windowMs) {
      requests.set(key, { start: now, count: 1 });
      return next();
    }

    record.count++;

    if (record.count > max) {
      logger.warn({ ip: key, count: record.count }, 'Rate limit exceeded');
      return res.status(429).json({
        error: { message: 'Too many requests. Please try again later.' }
      });
    }

    next();
  };
}

// src/middleware/auth.js

/**
 * Simplified auth for hackathon demo.
 * Injects businessId from env or request header.
 * In production, this would verify JWT/session tokens.
 */
export function authMiddleware(req, res, next) {
  // Check header first, fall back to env default
  const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;

  if (!businessId) {
    return res.status(401).json({
      error: { message: 'Business ID required. Set DEFAULT_BUSINESS_ID in .env or pass x-business-id header.' }
    });
  }

  req.businessId = businessId;
  next();
}

/**
 * Phone-based auth for ChatBot (customer-facing).
 * Validates phone number format.
 */
export function phoneAuth(req, res, next) {
  const phone = req.body.phone || req.query.phone;

  if (!phone || !/^\+91\d{10}$/.test(phone)) {
    return res.status(401).json({
      error: { message: 'Valid Indian phone number required (+91XXXXXXXXXX)' }
    });
  }

  req.customerPhone = phone;

  // Also inject businessId
  req.businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
  next();
}

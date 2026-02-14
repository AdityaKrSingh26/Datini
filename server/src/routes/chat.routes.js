// src/routes/chat.routes.js
import express from 'express';
import { getAgent } from '../agents/index.js';
import validate from '../middleware/validate.js';
import { chatMessageSchema } from '../validators/chat.validator.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/chat/message
 * Customer sends a message → ChatBot processes → response
 */
router.post('/message', validate(chatMessageSchema), async (req, res, next) => {
  try {
    const { phone, text, businessId: bodyBusinessId } = req.validatedBody;
    const businessId = bodyBusinessId || req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Business ID required' }
      });
    }

    const chatBot = getAgent(7);
    const result = await chatBot.process({ phone, text, businessId });

    res.json({
      success: true,
      botMessage: result.botMessage,
      session: {
        status: result.session.status,
        cart: result.session.context?.cart || [],
        awaitingConfirmation: result.session.context?.awaitingConfirmation || false
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Chat route error');
    next(err);
  }
});

export default router;

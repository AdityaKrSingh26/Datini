// src/routes/voice.routes.js
import express from 'express';
import { getAgent } from '../agents/index.js';
import validate from '../middleware/validate.js';
import { voiceCommandSchema } from '../validators/voice.validator.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/voice-command
 * Owner voice/text input → Command Center → Target Agent → response
 */
router.post('/', validate(voiceCommandSchema), async (req, res, next) => {
  try {
    const { audioText, language } = req.validatedBody;
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;

    // Step 1: Command Center classifies intent
    const commandCenter = getAgent(0);
    const classification = await commandCenter.process({ text: audioText, language });

    // Step 2: Route to target agent
    const targetAgent = getAgent(classification.agentId);
    if (!targetAgent) {
      return res.json({
        success: true,
        data: classification,
        responseText: `Intent: ${classification.intent}. Agent ${classification.agentId} not available.`
      });
    }

    // Step 3: Process with target agent
    const io = req.app.get('io');
    const result = await targetAgent.process({
      text: audioText,
      intent: classification.intent,
      businessId,
      params: classification.extractedParams,
      io
    });

    res.json({
      success: true,
      intent: classification.intent,
      confidence: classification.confidence,
      agentId: classification.agentId,
      ...result
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Voice command error');
    next(err);
  }
});

export default router;

// src/routes/insights.routes.js
import express from 'express';
import { getAgent } from '../agents/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/insights/weekly
 * Get weekly business report
 */
router.get('/weekly', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const insightsAgent = getAgent(6);

    const result = await insightsAgent.process({
      action: 'weekly_report',
      businessId
    });

    res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'Weekly insights error');
    next(err);
  }
});

export default router;

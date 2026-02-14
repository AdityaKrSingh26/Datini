// src/routes/gst.routes.js
import express from 'express';
import { getAgent } from '../agents/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/gst/summary
 * Get GST summary for current or specified month
 */
router.get('/summary', async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const gstAgent = getAgent(5);

    const result = await gstAgent.process({
      businessId,
      action: month ? 'monthly_summary' : undefined,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined
    });

    res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'GST summary error');
    next(err);
  }
});

/**
 * GET /api/gst/report
 * Alias for summary (same query: month, year)
 */
router.get('/report', async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const gstAgent = getAgent(5);

    const result = await gstAgent.process({
      businessId,
      action: month ? 'monthly_summary' : undefined,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined
    });

    res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'GST report error');
    next(err);
  }
});

export default router;

// src/routes/inventory.routes.js
import express from 'express';
import { getAgent } from '../agents/index.js';
import validate from '../middleware/validate.js';
import { inventoryScanSchema } from '../validators/inventory.validator.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/inventory
 * Get current stock list with alerts
 */
router.get('/', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const inventoryAgent = getAgent(2);

    const result = await inventoryAgent.process({
      action: 'check_stock',
      businessId
    });

    res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'Inventory get error');
    next(err);
  }
});

/**
 * POST /api/inventory/scan
 * Upload shelf photo for Agentic Vision inventory count
 */
router.post('/scan', validate(inventoryScanSchema), async (req, res, next) => {
  try {
    const { image } = req.validatedBody;
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const inventoryAgent = getAgent(2);

    const result = await inventoryAgent.process({
      action: 'scan',
      businessId,
      image
    });

    res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'Inventory scan error');
    next(err);
  }
});

export default router;

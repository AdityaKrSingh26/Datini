// src/routes/inventory.routes.js
import express from 'express';
import { getAgent } from '../agents/index.js';
import { Product } from '../models/index.js';
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
 * GET /api/inventory/:id
 * Get single product by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const product = await Product.findOne({ _id: req.params.id, businessId }).lean();
    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    logger.error({ err: err.message }, 'Inventory get by id error');
    next(err);
  }
});

/**
 * PUT /api/inventory/:id/stock
 * Update product stock (quantity, reason)
 */
router.put('/:id/stock', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const product = await Product.findOne({ _id: req.params.id, businessId });
    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }
    const { quantity, reason } = req.body ?? {};
    if (typeof quantity !== 'number') {
      return res.status(400).json({ success: false, error: { message: 'quantity (number) required' } });
    }
    product.currentStock = quantity;
    await product.save();
    res.json({ success: true, data: product.toObject() });
  } catch (err) {
    logger.error({ err: err.message }, 'Inventory update stock error');
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

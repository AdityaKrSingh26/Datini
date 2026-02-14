// src/routes/order.routes.js
import express from 'express';
import { getAgent } from '../agents/index.js';
import validate from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/orders
 * List orders with optional status filter and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;

    const orderManager = getAgent(8);

    const result = await orderManager.process({
      action: 'list',
      businessId,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'Order list error');
    next(err);
  }
});

/**
 * POST /api/orders
 * Create order manually (not via ChatBot)
 */
router.post('/', validate(createOrderSchema), async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const orderManager = getAgent(8);
    const io = req.app.get('io');

    const result = await orderManager.process({
      action: 'create',
      businessId,
      io,
      ...req.validatedBody
    });

    res.status(201).json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'Order creation error');
    next(err);
  }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status: accept, reject, dispatch, deliver
 */
router.patch('/:id/status', validate(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const { status } = req.validatedBody;
    const orderId = req.params.id;
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const io = req.app.get('io');
    const orderManager = getAgent(8);

    // Map status to action
    const actionMap = {
      'accepted': 'accept',
      'cancelled': 'reject',
      'preparing': 'accept',
      'out_for_delivery': 'dispatch',
      'delivered': 'deliver'
    };

    const action = actionMap[status] || status;

    const result = await orderManager.process({
      action,
      businessId,
      orderId,
      io
    });

    res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'Order status update error');
    next(err);
  }
});

export default router;

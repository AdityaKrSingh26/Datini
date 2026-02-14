// src/routes/customer.routes.js
import express from 'express';
import { Customer } from '../models/index.js';
import { getAgent } from '../agents/index.js';
import EventService from '../services/EventService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/customers
 * List all customers with credit balances
 */
router.get('/', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;

    const customers = await Customer.find({ businessId })
      .sort({ totalSpent: -1 })
      .lean();

    res.json({
      success: true,
      data: { customers, total: customers.length }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Customer list error');
    next(err);
  }
});

/**
 * GET /api/customers/phone/:phone
 * Get customer by phone number
 */
router.get('/phone/:phone', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const customer = await Customer.findOne({ businessId, phone: req.params.phone }).lean();
    if (!customer) {
      return res.status(404).json({ success: false, error: { message: 'Customer not found' } });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    logger.error({ err: err.message }, 'Customer get by phone error');
    next(err);
  }
});

/**
 * GET /api/customers/:id
 * Get single customer by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const customer = await Customer.findOne({ _id: req.params.id, businessId }).lean();
    if (!customer) {
      return res.status(404).json({ success: false, error: { message: 'Customer not found' } });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    logger.error({ err: err.message }, 'Customer get by id error');
    next(err);
  }
});

/**
 * PUT /api/customers/:id/credit
 * Update customer credit balance (amount delta, note)
 */
router.put('/:id/credit', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const customer = await Customer.findOne({ _id: req.params.id, businessId });
    if (!customer) {
      return res.status(404).json({ success: false, error: { message: 'Customer not found' } });
    }
    const { amount, note } = req.body ?? {};
    if (typeof amount !== 'number') {
      return res.status(400).json({ success: false, error: { message: 'amount (number) required' } });
    }
    customer.creditBalance = Math.max(0, (customer.creditBalance || 0) + amount);
    await customer.save();
    res.json({ success: true, data: customer.toObject() });
  } catch (err) {
    logger.error({ err: err.message }, 'Customer update credit error');
    next(err);
  }
});

/**
 * POST /api/customers/:id/remind
 * Send credit reminder to customer via ChatBot
 */
router.post('/:id/remind', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { message: 'Customer not found' }
      });
    }

    if (customer.creditBalance <= 0) {
      return res.json({
        success: true,
        message: 'No outstanding credit for this customer.'
      });
    }

    // Send reminder via ChatBot
    const chatBot = getAgent(7);
    const reminderText = `Reminder: ₹${customer.creditBalance} baki hai. Please pay soon.`;

    await chatBot.process({
      phone: customer.phone,
      text: reminderText,
      businessId
    });

    // Emit event to owner
    const io = req.app.get('io');
    if (io) {
      const eventService = new EventService(io);
      eventService.creditReminderSent(businessId, customer._id, customer.creditBalance);
    }

    res.json({
      success: true,
      message: `Reminder sent to ${customer.name} (${customer.phone})`,
      creditBalance: customer.creditBalance
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Customer remind error');
    next(err);
  }
});

export default router;

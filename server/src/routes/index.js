// src/routes/index.js
import express from 'express';
import voiceRoutes from './voice.routes.js';
import chatRoutes from './chat.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import orderRoutes from './order.routes.js';
import inventoryRoutes from './inventory.routes.js';
import gstRoutes from './gst.routes.js';
import customerRoutes from './customer.routes.js';
import insightsRoutes from './insights.routes.js';

const router = express.Router();

// Mount all routes
router.use('/voice-command', voiceRoutes);
router.use('/chat', chatRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/gst', gstRoutes);
router.use('/customers', customerRoutes);
router.use('/insights', insightsRoutes);

export default router;

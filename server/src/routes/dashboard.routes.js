// src/routes/dashboard.routes.js
import express from 'express';
import { getAgent } from '../agents/index.js';
import { Customer } from '../models/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/dashboard
 * Returns aggregated dashboard data: P&L, stock alerts, pending orders, GST, credit
 */
router.get('/', async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || process.env.DEFAULT_BUSINESS_ID;
    const insightsAgent = getAgent(6);

    // Get dashboard data from Insights agent
    const dashboardResult = await insightsAgent.process({
      action: 'dashboard',
      businessId
    });

    // Get GST summary
    const gstAgent = getAgent(5);
    const gstResult = await gstAgent.process({ businessId });

    // Get credit summary
    const creditCustomers = await Customer.find({
      businessId,
      creditBalance: { $gt: 0 }
    }).sort({ creditBalance: -1 }).lean();

    const totalCredit = creditCustomers.reduce((sum, c) => sum + c.creditBalance, 0);

    res.json({
      success: true,
      data: {
        pnl: dashboardResult.data?.pnl || { sales: 0, expenses: 0, profit: 0 },
        pendingOrders: dashboardResult.data?.pendingOrders || 0,
        stockAlerts: dashboardResult.data?.stockAlerts || [],
        stockAlertCount: dashboardResult.data?.stockAlertCount || 0,
        gstStatus: {
          netPayable: gstResult.data?.netPayable || 0,
          nextDueDate: gstResult.data?.nextDueDate || null
        },
        creditSummary: {
          totalOutstanding: totalCredit,
          customersWithCredit: creditCustomers.length,
          topDebtor: creditCustomers[0]?.name || null,
          topDebtorAmount: creditCustomers[0]?.creditBalance || 0
        }
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Dashboard error');
    next(err);
  }
});

export default router;

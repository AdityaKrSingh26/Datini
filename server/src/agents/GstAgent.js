// src/agents/GstAgent.js
import BaseAgent from './BaseAgent.js';
import { getGstCalculatePrompt } from '../prompts/gstCalculate.prompt.js';
import { Transaction } from '../models/index.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { getGstRate } from '../utils/gstRates.js';
import logger from '../utils/logger.js';

class GstAgent extends BaseAgent {
  constructor() {
    super({ name: 'GST', model: 'pro', thinkingLevel: 'HIGH' });
  }

  /**
   * Process GST queries: monthly summary, item-level calculation, GSTR preview.
   */
  async process({ businessId, action, month, year, items }) {
    switch (action) {
      case 'calculate_items':
        return this.calculateForItems({ items });
      case 'monthly_summary':
        return this.getMonthlySummary({ businessId, month, year });
      default:
        return this.getCurrentSummary(businessId);
    }
  }

  /**
   * Calculate GST for a set of items (used by Order Manager).
   */
  async calculateForItems({ items }) {
    let totalGst = 0;
    const breakdown = items.map(item => {
      const gstAmount = item.totalPrice * (item.gstRate || 0) / (100 + (item.gstRate || 0));
      totalGst += gstAmount;
      return {
        name: item.name,
        hsnCode: item.hsnCode || '',
        taxableValue: Math.round((item.totalPrice - gstAmount) * 100) / 100,
        gstRate: item.gstRate || 0,
        gstAmount: Math.round(gstAmount * 100) / 100
      };
    });

    return {
      success: true,
      data: { totalGst: Math.round(totalGst * 100) / 100, breakdown }
    };
  }

  /**
   * Get current month's GST summary.
   */
  async getCurrentSummary(businessId) {
    const now = new Date();
    return this.getMonthlySummary({
      businessId,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
  }

  /**
   * Get monthly GST summary with GSTR-like breakdown.
   */
  async getMonthlySummary({ businessId, month, year }) {
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();
    const period = `${new Date(y, m - 1).toLocaleString('default', { month: 'short' })} ${y}`;

    // Fetch monthly transactions
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const transactions = await Transaction.find({
      businessId,
      createdAt: { $gte: start, $lt: end }
    }).lean();

    // Calculate totals
    let totalSales = 0;
    let totalPurchases = 0;
    let gstCollected = 0;
    let itcAvailable = 0;

    const hsnBreakdown = {};

    for (const t of transactions) {
      if (t.type === 'sale') {
        totalSales += t.totalAmount;
        gstCollected += t.gstTotal || 0;
      }
      if (t.type === 'purchase') {
        totalPurchases += t.totalAmount;
        itcAvailable += t.gstTotal || 0;
      }

      // HSN breakdown
      for (const item of (t.items || [])) {
        if (item.productId) {
          const hsn = item.hsnCode || 'UNKNOWN';
          if (!hsnBreakdown[hsn]) {
            hsnBreakdown[hsn] = { hsnCode: hsn, name: item.name, taxableValue: 0, gstAmount: 0 };
          }
          hsnBreakdown[hsn].taxableValue += (item.totalPrice || 0) - (item.gstAmount || 0);
          hsnBreakdown[hsn].gstAmount += item.gstAmount || 0;
        }
      }
    }

    const netPayable = Math.max(0, gstCollected - itcAvailable);

    // Next due date (20th of next month)
    const nextDue = new Date(y, m, 20);

    const result = {
      period,
      totalSales: Math.round(totalSales),
      gstCollected: Math.round(gstCollected * 100) / 100,
      totalPurchases: Math.round(totalPurchases),
      itcAvailable: Math.round(itcAvailable * 100) / 100,
      netPayable: Math.round(netPayable * 100) / 100,
      nextDueDate: nextDue.toISOString().split('T')[0],
      breakdown: Object.values(hsnBreakdown),
      transactionCount: transactions.length
    };

    const responseText = `GST Summary (${period}): Collected ${formatCurrency(gstCollected)}, ITC ${formatCurrency(itcAvailable)}, Net Payable ${formatCurrency(netPayable)}. Due: ${result.nextDueDate}`;

    return {
      success: true,
      data: result,
      responseText
    };
  }
}

export default GstAgent;

// src/agents/InsightsAgent.js
import BaseAgent from './BaseAgent.js';
import { getInsightsReportPrompt } from '../prompts/insightsReport.prompt.js';
import { Transaction, Business, Product, Order } from '../models/index.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import logger from '../utils/logger.js';

class InsightsAgent extends BaseAgent {
  constructor() {
    super({ name: 'Insights', model: 'pro', thinkingLevel: 'HIGH' });
  }

  /**
   * Process insights queries: weekly report, dashboard data.
   */
  async process({ businessId, action, text }) {
    switch (action) {
      case 'weekly_report':
        return this.getWeeklyReport(businessId);
      case 'dashboard':
        return this.getDashboardData(businessId);
      default:
        return this.getWeeklyReport(businessId);
    }
  }

  /**
   * Generate weekly business report using transaction data + LLM analysis.
   */
  async getWeeklyReport(businessId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const transactions = await Transaction.find({
      businessId,
      createdAt: { $gte: sevenDaysAgo }
    }).lean();

    const business = await Business.findById(businessId).lean();

    // Compute daily breakdown
    const dailyMap = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap[key] = { date: key, sales: 0, expenses: 0, profit: 0, count: 0 };
    }

    for (const t of transactions) {
      const key = t.createdAt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        if (t.type === 'sale') dailyMap[key].sales += t.totalAmount;
        if (t.type === 'expense' || t.type === 'purchase') dailyMap[key].expenses += t.totalAmount;
        dailyMap[key].count++;
      }
    }

    Object.values(dailyMap).forEach(d => { d.profit = d.sales - d.expenses; });

    const dailySales = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top products
    const productRevenue = {};
    for (const t of transactions) {
      if (t.type === 'sale') {
        for (const item of (t.items || [])) {
          const name = item.name || 'Unknown';
          if (!productRevenue[name]) productRevenue[name] = { name, revenue: 0, quantity: 0, unit: item.unit };
          productRevenue[name].revenue += item.totalPrice || 0;
          productRevenue[name].quantity += item.quantity || 0;
        }
      }
    }
    const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Summary
    const totalSales = dailySales.reduce((s, d) => s + d.sales, 0);
    const totalExpenses = dailySales.reduce((s, d) => s + d.expenses, 0);

    // Use LLM for trend analysis and recommendations
    const prompt = getInsightsReportPrompt({
      transactions: transactions.map(t => ({
        type: t.type,
        amount: t.totalAmount,
        items: (t.items || []).map(i => i.name),
        date: t.createdAt,
        payment: t.paymentMethod
      })),
      period: 'last 7 days',
      businessName: business?.name || 'Store'
    });

    let llmInsights;
    try {
      llmInsights = await this.callLLM(prompt + `\n\nPre-computed data for reference:
Daily: ${JSON.stringify(dailySales)}
Top Products: ${JSON.stringify(topProducts)}
Total Sales: ${totalSales}, Expenses: ${totalExpenses}`, { responseFormat: 'json' });
    } catch (err) {
      logger.warn({ err: err.message }, 'LLM insights call failed, using computed data only');
      llmInsights = {};
    }

    return {
      success: true,
      data: {
        period: 'last 7 days',
        summary: {
          totalSales: Math.round(totalSales),
          totalExpenses: Math.round(totalExpenses),
          netProfit: Math.round(totalSales - totalExpenses),
          transactionCount: transactions.length,
          avgOrderValue: transactions.length > 0 ? Math.round(totalSales / transactions.filter(t => t.type === 'sale').length) : 0
        },
        dailySales,
        topProducts,
        trends: llmInsights.trends || [],
        anomalies: llmInsights.anomalies || [],
        recommendations: llmInsights.recommendations || [],
        cashFlowForecast: llmInsights.cashFlowForecast || []
      },
      responseText: `Weekly Report: Sales ${formatCurrency(totalSales)}, Expenses ${formatCurrency(totalExpenses)}, Profit ${formatCurrency(totalSales - totalExpenses)}. Top seller: ${topProducts[0]?.name || 'N/A'}.`
    };
  }

  /**
   * Get dashboard aggregated data.
   */
  async getDashboardData(businessId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's P&L
    const todayTxns = await Transaction.find({
      businessId,
      createdAt: { $gte: today }
    }).lean();

    let sales = 0, expenses = 0, gst = 0;
    for (const t of todayTxns) {
      if (t.type === 'sale') { sales += t.totalAmount; gst += t.gstTotal || 0; }
      if (t.type === 'expense' || t.type === 'purchase') expenses += t.totalAmount;
    }

    // Pending orders
    const pendingOrders = await Order.countDocuments({ businessId, status: 'pending' });

    // Stock alerts
    const lowStockProducts = await Product.find({
      businessId,
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    }).select('nameEn currentStock reorderLevel').lean();

    return {
      success: true,
      data: {
        pnl: { sales, expenses, profit: sales - expenses, gst },
        pendingOrders,
        stockAlerts: lowStockProducts,
        stockAlertCount: lowStockProducts.length
      },
      responseText: `Dashboard: Sales ${formatCurrency(sales)}, Profit ${formatCurrency(sales - expenses)}, ${pendingOrders} pending orders, ${lowStockProducts.length} stock alerts.`
    };
  }
}

export default InsightsAgent;

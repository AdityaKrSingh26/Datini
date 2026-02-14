// src/agents/BookkeeperAgent.js
import BaseAgent from './BaseAgent.js';
import { getBookkeeperPrompt } from '../prompts/bookkeeper.prompt.js';
import { Transaction, Customer, CreditEntry, Product } from '../models/index.js';
import catalogService from '../services/CatalogService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { calculateGstInclusive } from '../utils/gstRates.js';
import logger from '../utils/logger.js';

class BookkeeperAgent extends BaseAgent {
  constructor() {
    super({ name: 'Bookkeeper', model: 'flash', thinkingLevel: 'LOW' });
  }

  /**
   * Process bookkeeper requests: record transactions, query P&L, check credit.
   * @param {Object} input
   * @param {string} input.text - Natural language input
   * @param {string} input.intent - Specific intent (record_sale, record_expense, credit_query, dashboard_query)
   * @param {string} input.businessId - Business ID
   * @param {Object} input.params - Extracted params from Command Center
   */
  async process({ text, intent, businessId, params = {} }) {
    switch (intent) {
      case 'record_sale':
      case 'record_expense':
        return this.recordTransaction({ text, businessId, params });
      case 'credit_query':
        return this.getCreditSummary(businessId);
      case 'dashboard_query':
        return this.getTodaySummary(businessId);
      default:
        return this.getTodaySummary(businessId);
    }
  }

  /**
   * Parse NL input and create a transaction.
   */
  async recordTransaction({ text, businessId, params }) {
    const catalog = await catalogService.getCatalogPromptString(businessId);
    const prompt = getBookkeeperPrompt({ catalog });

    const parsed = await this.callLLM(
      `${prompt}\n\nINPUT: "${text}"`,
      { responseFormat: 'json' }
    );

    if (parsed.needsClarification) {
      return {
        success: false,
        needsClarification: true,
        message: parsed.clarificationMessage,
        data: parsed
      };
    }

    // Resolve items to product IDs and compute totals
    const resolvedItems = [];
    let totalAmount = 0;
    let gstTotal = 0;

    for (const item of (parsed.items || [])) {
      const product = await Product.findByAlias(businessId, item.alias);
      if (product) {
        const itemTotal = product.pricePerUnit * item.quantity;
        const gstAmount = calculateGstInclusive(itemTotal, product.gstRate);
        resolvedItems.push({
          productId: product._id,
          name: product.nameEn,
          quantity: item.quantity,
          unit: item.unit || product.unit,
          unitPrice: product.pricePerUnit,
          totalPrice: itemTotal,
          gstAmount
        });
        totalAmount += itemTotal;
        gstTotal += gstAmount;
      }
    }

    // Use LLM-parsed total if no products resolved (e.g., expense)
    if (resolvedItems.length === 0 && parsed.totalAmount) {
      totalAmount = parsed.totalAmount;
    }

    const transaction = await Transaction.create({
      businessId,
      type: parsed.type || 'sale',
      source: 'voice',
      items: resolvedItems,
      customerName: parsed.customerName,
      customerPhone: params.customerPhone || null,
      totalAmount,
      gstTotal,
      paymentMethod: parsed.paymentMethod || 'cash',
      rawInput: text
    });

    // Handle credit if payment is on credit
    if (parsed.paymentMethod === 'credit' && parsed.customerName) {
      const customer = await Customer.findOne({ businessId, name: new RegExp(parsed.customerName, 'i') });
      if (customer) {
        await CreditEntry.create({
          businessId,
          customerPhone: customer.phone,
          amount: totalAmount,
          type: 'debit',
          productSummary: resolvedItems.map(i => `${i.name} x${i.quantity}`).join(', ')
        });
        customer.creditBalance += totalAmount;
        await customer.save();
      }
    }

    // Generate response text
    const responseText = parsed.type === 'sale'
      ? `Sale recorded: ${formatCurrency(totalAmount)}${parsed.customerName ? ` for ${parsed.customerName}` : ''} (${parsed.paymentMethod})`
      : `Expense recorded: ${formatCurrency(totalAmount)} (${parsed.paymentMethod})`;

    return {
      success: true,
      data: { transaction: transaction.toObject() },
      responseText
    };
  }

  /**
   * Get today's P&L summary.
   */
  async getTodaySummary(businessId) {
    const summary = await Transaction.todaySummary(businessId);

    const result = { sales: 0, expenses: 0, purchases: 0, netProfit: 0, gst: 0, transactionCount: 0 };
    for (const row of summary) {
      if (row._id === 'sale') { result.sales = row.total; result.gst += row.gst; }
      if (row._id === 'expense') { result.expenses = row.total; }
      if (row._id === 'purchase') { result.purchases = row.total; }
      result.transactionCount += row.count;
    }
    result.netProfit = result.sales - result.expenses - result.purchases;

    const responseText = `Aaj ki summary: Sale ${formatCurrency(result.sales)}, Kharcha ${formatCurrency(result.expenses)}, Profit ${formatCurrency(result.netProfit)}`;

    return {
      success: true,
      data: result,
      responseText
    };
  }

  /**
   * Get credit/udhar summary.
   */
  async getCreditSummary(businessId) {
    const customers = await Customer.withCredit(businessId);
    const totalCredit = customers.reduce((sum, c) => sum + c.creditBalance, 0);

    const creditList = customers.map(c => ({
      name: c.name,
      phone: c.phone,
      balance: c.creditBalance,
      balanceFormatted: formatCurrency(c.creditBalance)
    }));

    const responseText = `Total udhar: ${formatCurrency(totalCredit)}. ${customers.length} customers with pending credit.`;

    return {
      success: true,
      data: { totalCredit, customers: creditList },
      responseText
    };
  }
}

export default BookkeeperAgent;

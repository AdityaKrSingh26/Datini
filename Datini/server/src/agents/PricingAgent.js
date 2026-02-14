// src/agents/PricingAgent.js
import BaseAgent from './BaseAgent.js';
import { Product, Supplier, Transaction } from '../models/index.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

class PricingAgent extends BaseAgent {
  constructor() {
    super({ name: 'Pricing', model: 'pro', thinkingLevel: 'HIGH' });
  }

  /**
   * Analyze pricing and recommend optimal prices.
   */
  async process({ businessId, productId, text }) {
    if (productId) {
      return this.analyzeProduct({ businessId, productId });
    }
    return this.handleQuery({ businessId, text });
  }

  /**
   * Full pricing analysis for a single product.
   */
  async analyzeProduct({ businessId, productId }) {
    const product = await Product.findById(productId);
    if (!product) return { success: false, responseText: 'Product not found' };

    // Get supplier cost (lowest)
    const suppliers = await Supplier.find({
      businessId,
      'products.productId': productId
    }).lean();

    let costPrice = product.pricePerUnit * 0.75; // Default: assume 25% margin
    if (suppliers.length > 0) {
      const costs = suppliers.map(s => {
        const sp = s.products.find(p => p.productId.toString() === productId.toString());
        return sp ? sp.pricePerUnit : Infinity;
      });
      costPrice = Math.min(...costs);
    }

    // Get recent sales volume
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await Transaction.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), type: 'sale', createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' } } }
    ]);

    const sales = salesData[0] || { totalQty: 0, totalRevenue: 0 };
    const currentMargin = ((product.pricePerUnit - costPrice) / product.pricePerUnit * 100).toFixed(1);

    // Use LLM for pricing recommendation
    const result = await this.callLLM(
      `You are a pricing analyst for a kirana store.
PRODUCT: ${product.nameEn}
CATEGORY: ${product.category}
CURRENT PRICE: ₹${product.pricePerUnit}/${product.unit}
COST PRICE: ₹${costPrice}/${product.unit}
CURRENT MARGIN: ${currentMargin}%
MONTHLY SALES: ${sales.totalQty} ${product.unit} (₹${sales.totalRevenue} revenue)
GST RATE: ${product.gstRate}%
DAILY SALES AVG: ${product.avgDailySales} ${product.unit}

Recommend optimal pricing. Consider: category norms, competition, demand elasticity, margin targets.
OUTPUT JSON: {"recommendedPrice": number, "marginPct": number, "reasoning": "string", "priceRange": {"min": number, "max": number}}`,
      { responseFormat: 'json' }
    );

    return {
      success: true,
      data: {
        product: product.nameEn,
        currentPrice: product.pricePerUnit,
        costPrice,
        currentMargin: parseFloat(currentMargin),
        recommendedPrice: result.recommendedPrice,
        recommendedMargin: result.marginPct,
        priceRange: result.priceRange,
        monthlySales: sales.totalQty,
        monthlyRevenue: sales.totalRevenue
      },
      responseText: `${product.nameEn}: Current price ${formatCurrency(product.pricePerUnit)}, Cost ${formatCurrency(costPrice)}, Margin ${currentMargin}%. Recommended: ${formatCurrency(result.recommendedPrice)} (${result.marginPct}% margin). ${result.reasoning}`
    };
  }

  /**
   * Handle natural language pricing queries.
   */
  async handleQuery({ businessId, text }) {
    const products = await Product.find({ businessId }).select('nameEn pricePerUnit unit category gstRate').lean();

    const result = await this.callLLM(
      `You are a pricing analyst for a kirana store.
PRODUCT CATALOG: ${JSON.stringify(products.map(p => ({ name: p.nameEn, price: p.pricePerUnit, unit: p.unit, category: p.category })))}
QUERY: "${text}"
Respond in JSON: {"analysis": "string", "recommendations": [{"product": "string", "currentPrice": number, "recommendedPrice": number, "reason": "string"}]}`,
      { responseFormat: 'json' }
    );

    return {
      success: true,
      data: result,
      responseText: result.analysis || 'Pricing analysis complete.'
    };
  }
}

export default PricingAgent;

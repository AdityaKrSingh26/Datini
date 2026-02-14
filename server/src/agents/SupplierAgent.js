// src/agents/SupplierAgent.js
import BaseAgent from './BaseAgent.js';
import { Supplier, Product } from '../models/index.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import logger from '../utils/logger.js';

class SupplierAgent extends BaseAgent {
  constructor() {
    super({ name: 'SupplierIntel', model: 'pro', thinkingLevel: 'HIGH' });
  }

  /**
   * Process supplier queries: compare prices, generate PO.
   */
  async process({ action, businessId, productId, text }) {
    switch (action) {
      case 'compare_prices':
        return this.comparePrices({ businessId, productId });
      case 'generate_po':
        return this.generatePO({ businessId, productId });
      case 'query':
        return this.handleQuery({ businessId, text });
      default:
        return this.handleQuery({ businessId, text });
    }
  }

  /**
   * Compare supplier prices for a product.
   */
  async comparePrices({ businessId, productId }) {
    const product = await Product.findById(productId);
    if (!product) return { success: false, responseText: 'Product not found' };

    const suppliers = await Supplier.find({
      businessId,
      'products.productId': productId
    }).lean();

    const comparison = suppliers.map(s => {
      const sp = s.products.find(p => p.productId.toString() === productId.toString());
      return {
        supplierName: s.name,
        phone: s.phone,
        pricePerUnit: sp.pricePerUnit,
        minOrderQty: sp.minOrderQty,
        deliveryDays: sp.deliveryDays,
        reliabilityScore: s.reliabilityScore,
        savings: product.pricePerUnit - sp.pricePerUnit,
        savingsPercent: Math.round((1 - sp.pricePerUnit / product.pricePerUnit) * 100)
      };
    }).sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    const best = comparison[0];
    const responseText = best
      ? `Best price for ${product.nameEn}: ${formatCurrency(best.pricePerUnit)}/${product.unit} from ${best.supplierName} (${best.savingsPercent}% margin). Delivery: ${best.deliveryDays} days.`
      : `No supplier data found for ${product.nameEn}.`;

    return {
      success: true,
      data: { product: product.nameEn, comparison },
      responseText
    };
  }

  /**
   * Generate a Purchase Order for restocking.
   */
  async generatePO({ businessId, productId }) {
    const product = await Product.findById(productId);
    if (!product) return { success: false, responseText: 'Product not found' };

    // Find best-priced supplier
    const suppliers = await Supplier.find({
      businessId,
      'products.productId': productId
    }).lean();

    if (suppliers.length === 0) {
      return { success: false, responseText: `No suppliers found for ${product.nameEn}` };
    }

    const bestSupplier = suppliers.reduce((best, s) => {
      const sp = s.products.find(p => p.productId.toString() === productId.toString());
      const bestSp = best.products.find(p => p.productId.toString() === productId.toString());
      return sp.pricePerUnit < bestSp.pricePerUnit ? s : best;
    });

    const sp = bestSupplier.products.find(p => p.productId.toString() === productId.toString());
    const orderQty = Math.max(sp.minOrderQty, product.reorderLevel * 2);
    const totalCost = sp.pricePerUnit * orderQty;

    const po = {
      supplier: bestSupplier.name,
      supplierPhone: bestSupplier.phone,
      product: product.nameEn,
      quantity: orderQty,
      unit: product.unit,
      unitPrice: sp.pricePerUnit,
      totalCost,
      deliveryDays: sp.deliveryDays,
      generatedAt: new Date().toISOString()
    };

    return {
      success: true,
      data: { po },
      responseText: `PO generated: ${orderQty} ${product.unit} of ${product.nameEn} from ${bestSupplier.name} @ ${formatCurrency(sp.pricePerUnit)}/${product.unit}. Total: ${formatCurrency(totalCost)}. Delivery: ${sp.deliveryDays} days.`
    };
  }

  /**
   * Handle natural language supplier queries using LLM.
   */
  async handleQuery({ businessId, text }) {
    const suppliers = await Supplier.find({ businessId }).populate('products.productId').lean();

    const supplierInfo = suppliers.map(s => ({
      name: s.name,
      reliability: s.reliabilityScore,
      products: s.products.map(p => ({
        name: p.productId?.nameEn || 'Unknown',
        price: p.pricePerUnit,
        minQty: p.minOrderQty,
        delivery: p.deliveryDays
      }))
    }));

    const result = await this.callLLM(
      `You are a supplier intelligence agent for a kirana store.
SUPPLIER DATA: ${JSON.stringify(supplierInfo)}
QUERY: "${text}"
Respond with a helpful analysis in JSON: {"analysis": "string", "recommendation": "string", "data": {}}`,
      { responseFormat: 'json' }
    );

    return {
      success: true,
      data: result.data || {},
      responseText: result.analysis || result.recommendation || 'No supplier insights available.'
    };
  }
}

export default SupplierAgent;

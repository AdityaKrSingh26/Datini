// src/agents/InventoryVisionAgent.js
import BaseAgent from './BaseAgent.js';
import { getInventoryVisionPrompt } from '../prompts/inventoryVision.prompt.js';
import { Product, InventorySnapshot } from '../models/index.js';
import catalogService from '../services/CatalogService.js';
import logger from '../utils/logger.js';

class InventoryVisionAgent extends BaseAgent {
  constructor() {
    super({ name: 'InventoryVision', model: 'pro', thinkingLevel: 'HIGH' });
  }

  /**
   * Process inventory requests: scan shelf photo, check stock, get alerts.
   */
  async process({ action, businessId, image = null }) {
    switch (action) {
      case 'scan':
        return this.scanShelf({ businessId, image });
      case 'check_stock':
        return this.getStockStatus(businessId);
      case 'check_availability':
        return this.checkAvailability(arguments[0]);
      default:
        return this.getStockStatus(businessId);
    }
  }

  /**
   * Scan a shelf photo using Gemini Pro Vision.
   */
  async scanShelf({ businessId, image }) {
    const catalog = await catalogService.getCatalogPromptString(businessId);
    const prompt = getInventoryVisionPrompt({ catalog });

    const visionResult = await this.callLLM(prompt, {
      media: image,
      mediaResolution: 'ULTRA_HIGH',
      responseFormat: 'json'
    });

    // Match detected items to catalog and update stock
    const updatedProducts = [];
    const alerts = [];

    for (const detected of (visionResult.itemsDetected || [])) {
      const product = await Product.findOne({
        businessId,
        nameEn: new RegExp(detected.catalogMatch || detected.nameDetected, 'i')
      });

      if (product) {
        const oldStock = product.currentStock;
        product.currentStock = detected.count;
        await product.save();

        updatedProducts.push({
          name: product.nameEn,
          oldStock,
          newStock: detected.count,
          confidence: detected.confidence
        });

        if (product.needsReorder()) {
          alerts.push({
            productId: product._id,
            alertType: detected.count === 0 ? 'out_of_stock' : 'low_stock',
            currentCount: detected.count,
            reorderLevel: product.reorderLevel,
            suggestedAction: `Reorder ${product.nameEn}`
          });
        }
      }
    }

    // Save snapshot
    const snapshot = await InventorySnapshot.create({
      businessId,
      source: 'camera_scan',
      itemsDetected: visionResult.itemsDetected || [],
      alerts,
      zonesScanned: visionResult.zonesScanned || 1,
      totalItemsCounted: visionResult.totalItemsCounted || 0
    });

    // Invalidate catalog cache since stock changed
    catalogService.invalidate(businessId);

    return {
      success: true,
      data: {
        snapshot: snapshot.toObject(),
        updatedProducts,
        alerts
      },
      responseText: visionResult.summary || `Scanned ${updatedProducts.length} products. ${alerts.length} alerts.`
    };
  }

  /**
   * Get current stock status with alerts.
   */
  async getStockStatus(businessId) {
    const products = await Product.find({ businessId })
      .select('nameEn nameHi currentStock reorderLevel available unit avgDailySales')
      .sort({ currentStock: 1 })
      .lean();

    const lowStock = products.filter(p => p.currentStock <= p.reorderLevel && p.currentStock > 0);
    const outOfStock = products.filter(p => p.currentStock === 0);

    return {
      success: true,
      data: {
        products,
        lowStock,
        outOfStock,
        totalProducts: products.length,
        healthyCount: products.length - lowStock.length - outOfStock.length
      },
      responseText: `Stock status: ${outOfStock.length} out of stock, ${lowStock.length} low stock, ${products.length - lowStock.length - outOfStock.length} healthy.`
    };
  }

  /**
   * Check availability for specific items (called by ChatBot via A2A).
   * @param {Object} input
   * @param {string} input.businessId
   * @param {Array<{productId: string, quantity: number}>} input.items
   */
  async checkAvailability({ businessId, items }) {
    const results = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        results.push({ productId: item.productId, available: false, reason: 'not_found' });
        continue;
      }

      const available = product.available && product.currentStock >= item.quantity;
      results.push({
        productId: item.productId,
        name: product.nameEn,
        available,
        currentStock: product.currentStock,
        requested: item.quantity,
        reason: !product.available ? 'discontinued' : product.currentStock < item.quantity ? 'insufficient_stock' : 'ok'
      });
    }

    const allAvailable = results.every(r => r.available);

    return {
      success: true,
      allAvailable,
      items: results
    };
  }
}

export default InventoryVisionAgent;

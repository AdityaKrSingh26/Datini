// src/services/CatalogService.js
import { Product } from '../models/index.js';
import cacheService from './CacheService.js';
import logger from '../utils/logger.js';

const CATALOG_CACHE_KEY = 'product_catalog';
const ALIAS_MAP_CACHE_KEY = 'alias_map';

class CatalogService {
  /**
   * Load product catalog for a business. Caches for 5 minutes.
   * Returns array of simplified product objects for injection into LLM prompts.
   */
  async getCatalog(businessId) {
    const cached = cacheService.get(`${CATALOG_CACHE_KEY}:${businessId}`);
    if (cached) return cached;

    const products = await Product.find({ businessId, available: true })
      .select('nameEn nameHi nameKn aliases category unit pricePerUnit currentStock hsnCode gstRate')
      .lean();

    const catalog = products.map(p => ({
      id: p._id.toString(),
      nameEn: p.nameEn,
      nameHi: p.nameHi,
      nameKn: p.nameKn,
      aliases: p.aliases,
      category: p.category,
      unit: p.unit,
      price: p.pricePerUnit,
      inStock: p.currentStock > 0,
      stock: p.currentStock,
      hsnCode: p.hsnCode,
      gstRate: p.gstRate
    }));

    cacheService.set(`${CATALOG_CACHE_KEY}:${businessId}`, catalog, 300);
    logger.info({ businessId, productCount: catalog.length }, 'Catalog loaded');
    return catalog;
  }

  /**
   * Get alias → productId map for ChatBot NLU matching.
   */
  async getAliasMap(businessId) {
    const cached = cacheService.get(`${ALIAS_MAP_CACHE_KEY}:${businessId}`);
    if (cached) return cached;

    const products = await Product.find({ businessId, available: true })
      .select('nameEn aliases')
      .lean();

    const aliasMap = {};
    for (const p of products) {
      for (const alias of (p.aliases || [])) {
        aliasMap[alias.toLowerCase()] = {
          productId: p._id.toString(),
          nameEn: p.nameEn
        };
      }
    }

    cacheService.set(`${ALIAS_MAP_CACHE_KEY}:${businessId}`, aliasMap, 300);
    return aliasMap;
  }

  /**
   * Generate catalog string for injection into LLM prompts.
   */
  async getCatalogPromptString(businessId) {
    const catalog = await this.getCatalog(businessId);
    return catalog.map(p =>
      `${p.nameEn} (${p.nameHi || ''}) — ₹${p.price}/${p.unit} — ${p.inStock ? 'In Stock' : 'OUT OF STOCK'} — aliases: ${p.aliases.join(', ')}`
    ).join('\n');
  }

  /**
   * Invalidate catalog cache (call after stock changes).
   */
  invalidate(businessId) {
    cacheService.del(`${CATALOG_CACHE_KEY}:${businessId}`);
    cacheService.del(`${ALIAS_MAP_CACHE_KEY}:${businessId}`);
    logger.info({ businessId }, 'Catalog cache invalidated');
  }
}

export default new CatalogService();

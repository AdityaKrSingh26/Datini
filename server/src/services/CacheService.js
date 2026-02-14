// src/services/CacheService.js
import NodeCache from 'node-cache';
import logger from '../utils/logger.js';

class CacheService {
  constructor(ttlSeconds = 300) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false
    });
    logger.info({ ttlSeconds }, 'CacheService initialized');
  }

  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      logger.debug({ key }, 'Cache HIT');
    }
    return value;
  }

  set(key, value, ttl) {
    return this.cache.set(key, value, ttl);
  }

  del(key) {
    return this.cache.del(key);
  }

  flush() {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats() {
    return this.cache.getStats();
  }
}

// Singleton
const cacheService = new CacheService();

export default cacheService;

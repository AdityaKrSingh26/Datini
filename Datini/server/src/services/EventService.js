// src/services/EventService.js
import logger from '../utils/logger.js';

class EventService {
  constructor(io) {
    this.io = io;
  }

  emitToOwner(businessId, event, data) {
    this.io.to(`business:${businessId}`).emit(event, {
      event,
      timestamp: new Date().toISOString(),
      data
    });
    logger.info({ event, businessId }, 'Event emitted to owner');
  }

  emitToCustomer(sessionId, event, data) {
    this.io.to(`session:${sessionId}`).emit(event, {
      event,
      timestamp: new Date().toISOString(),
      data
    });
    logger.info({ event, sessionId }, 'Event emitted to customer');
  }

  // --- Predefined events ---

  newOrder(businessId, order) {
    this.emitToOwner(businessId, 'new_order', {
      orderId: order.orderId,
      customerName: order.customerName,
      itemCount: order.items.length,
      total: order.grandTotal
    });
  }

  orderStatusChanged(sessionId, orderId, status, message) {
    this.emitToCustomer(sessionId, 'order_status_changed', {
      orderId, status, message
    });
  }

  stockAlert(businessId, product) {
    this.emitToOwner(businessId, 'stock_alert', {
      productId: product._id,
      name: product.nameEn,
      currentStock: product.currentStock,
      reorderLevel: product.reorderLevel
    });
  }

  dailySummary(businessId, summary) {
    this.emitToOwner(businessId, 'daily_summary', summary);
  }

  creditReminderSent(businessId, customerId, amount) {
    this.emitToOwner(businessId, 'credit_reminder_sent', {
      customerId, amount
    });
  }
}

export default EventService;

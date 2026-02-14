// src/agents/OrderManagerAgent.js
import BaseAgent from './BaseAgent.js';
import { Order, Product, Customer } from '../models/index.js';
import EventService from '../services/EventService.js';
import catalogService from '../services/CatalogService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import logger from '../utils/logger.js';

class OrderManagerAgent extends BaseAgent {
  constructor() {
    super({ name: 'OrderManager', model: 'flash', thinkingLevel: 'LOW' });
    this._eventService = null;
  }

  /**
   * Get EventService lazily (io might not be ready at construction time).
   */
  getEventService(io) {
    if (io && !this._eventService) {
      this._eventService = new EventService(io);
    }
    return this._eventService;
  }

  /**
   * Process order actions: create, accept, reject, dispatch, deliver, list.
   */
  async process({ action, businessId, io, ...params }) {
    const eventService = this.getEventService(io);

    switch (action) {
      case 'create':
        return this.createOrder({ businessId, eventService, ...params });
      case 'accept':
        return this.acceptOrder({ businessId, eventService, ...params });
      case 'reject':
        return this.rejectOrder({ businessId, eventService, ...params });
      case 'dispatch':
        return this.dispatchOrder({ businessId, eventService, ...params });
      case 'deliver':
        return this.deliverOrder({ businessId, eventService, ...params });
      case 'list':
        return this.listOrders({ businessId, ...params });
      default:
        return { success: false, responseText: 'Unknown order action' };
    }
  }

  /**
   * Create a new order (called by ChatBot after confirmation).
   */
  async createOrder({ businessId, customerPhone, customerName, items, subtotal, grandTotal, paymentMethod, source, eventService }) {
    console.log('\n' + '▓'.repeat(80));
    console.log('📝 ORDER MANAGER - CREATE ORDER');
    console.log('▓'.repeat(80));
    console.log('Customer:', customerName || 'Unknown', '|', customerPhone);
    console.log('Items:', items.map(i => `${i.name} x${i.quantity}`).join(', '));
    console.log('Total:', formatCurrency(grandTotal));
    console.log('Payment:', paymentMethod || 'cod');
    console.log('Source:', source || 'chatbot');
    console.log('▓'.repeat(80) + '\n');

    const order = new Order({
      businessId,
      customerPhone,
      customerName: customerName || 'Unknown',
      items,
      subtotal: subtotal || grandTotal,
      grandTotal,
      paymentMethod: paymentMethod || 'cod',
      source: source || 'chatbot',
      status: 'pending'
    });

    await order.save();

    console.log('✅ Order created:', order.orderId, '\n');
    logger.info({ orderId: order.orderId, customerPhone }, 'Order created');

    // Update customer stats
    try {
      await Customer.findOneAndUpdate(
        { businessId, phone: customerPhone },
        {
          $inc: { totalOrders: 1, totalSpent: grandTotal },
          $set: { lastOrderDate: new Date() }
        },
        { upsert: true }
      );
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to update customer stats');
    }

    // Emit new_order event to owner dashboard
    if (eventService) {
      eventService.newOrder(businessId, order);
    }

    return {
      success: true,
      data: { order: order.toObject() },
      responseText: `Order ${order.orderId} created. Total: ${formatCurrency(grandTotal)}.`
    };
  }

  /**
   * Accept order — triggers cross-agent chain.
   */
  async acceptOrder({ businessId, orderId, eventService }) {
    console.log('\n' + '▓'.repeat(80));
    console.log('📦 ORDER MANAGER - ACCEPT ORDER');
    console.log('▓'.repeat(80));
    console.log('Order ID:', orderId);
    console.log('Business:', businessId);
    console.log('▓'.repeat(80) + '\n');

    // orderId can be either MongoDB _id or the human-readable orderId field
    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId }],
      businessId
    });
    if (!order) return { success: false, responseText: 'Order not found' };
    if (order.status !== 'pending') return { success: false, responseText: `Order is ${order.status}, cannot accept` };

    console.log('✅ Order found:', order.orderId);
    console.log('🛒 Items:', order.items.map(i => `${i.name} x${i.quantity}`).join(', '));
    console.log('💰 Total:', formatCurrency(order.grandTotal));

    order.status = 'accepted';
    order.acceptedAt = new Date();
    order.statusHistory.push({ status: 'accepted', changedBy: 'owner', changedAt: new Date() });
    await order.save();

    console.log('\n🔗 TRIGGERING A2A CHAIN...\n');
    logger.info({ orderId }, 'Order accepted — triggering A2A chain');

    // A2A CHAIN: Parallel triggers
    const { getAgent } = await import('./index.js');

    // 1. Bookkeeper: record sale
    try {
      const bookkeeper = getAgent(1);
      await bookkeeper.process({
        intent: 'record_sale',
        businessId,
        text: `Sale of ${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')} for ${formatCurrency(order.grandTotal)} via ChatBot`,
        params: { customerPhone: order.customerPhone }
      });
    } catch (err) {
      logger.error({ err: err.message, orderId }, 'Bookkeeper A2A failed');
    }

    // 2. Inventory: deduct stock
    try {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: -item.quantity }
        });
      }
      catalogService.invalidate(businessId);

      // Check for reorder alerts
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product && product.currentStock <= product.reorderLevel && eventService) {
          eventService.stockAlert(businessId, product);
        }
      }
    } catch (err) {
      logger.error({ err: err.message, orderId }, 'Inventory deduction failed');
    }

    // 3. GST: calculate
    try {
      const gstAgent = getAgent(5);
      const itemsWithGst = [];

      // Lookup GST rates from products
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          itemsWithGst.push({
            name: item.name,
            totalPrice: item.totalPrice,
            gstRate: product.gstRate || 0,
            hsnCode: product.hsnCode || ''
          });
        }
      }

      const gstResult = await gstAgent.process({
        action: 'calculate_items',
        items: itemsWithGst
      });

      if (gstResult.success) {
        order.gstTotal = gstResult.data.totalGst;
        await order.save();
      }
    } catch (err) {
      logger.error({ err: err.message, orderId }, 'GST calculation failed');
    }

    // 4. Notify customer
    if (eventService) {
      eventService.orderStatusChanged(
        order.customerPhone,
        order.orderId,
        'accepted',
        'Aapka order accept ho gaya! Taiyaar ho raha hai. 🎉'
      );
    }

    // Auto-transition to preparing
    order.status = 'preparing';
    order.statusHistory.push({ status: 'preparing', changedBy: 'system', changedAt: new Date() });
    await order.save();

    return {
      success: true,
      data: { order: order.toObject() },
      responseText: `Order ${orderId} accepted. A2A chain triggered.`
    };
  }

  /**
   * Reject order.
   */
  async rejectOrder({ businessId, orderId, eventService }) {
    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId }],
      businessId
    });
    if (!order) return { success: false, responseText: 'Order not found' };

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', changedBy: 'owner', changedAt: new Date() });
    await order.save();

    if (eventService) {
      eventService.orderStatusChanged(
        order.customerPhone,
        order.orderId,
        'cancelled',
        'Maaf kijiye, aapka order abhi process nahi ho sakta. 😔'
      );
    }

    return {
      success: true,
      data: { order: order.toObject() },
      responseText: `Order ${orderId} rejected.`
    };
  }

  /**
   * Dispatch order for delivery.
   */
  async dispatchOrder({ businessId, orderId, eventService }) {
    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId }],
      businessId
    });
    if (!order) return { success: false, responseText: 'Order not found' };

    order.status = 'out_for_delivery';
    order.statusHistory.push({ status: 'out_for_delivery', changedBy: 'owner', changedAt: new Date() });
    await order.save();

    if (eventService) {
      eventService.orderStatusChanged(
        order.customerPhone,
        order.orderId,
        'out_for_delivery',
        'Aapka order delivery ke liye nikal gaya! 🚀'
      );
    }

    return {
      success: true,
      data: { order: order.toObject() },
      responseText: `Order ${orderId} dispatched for delivery.`
    };
  }

  /**
   * Mark order as delivered.
   */
  async deliverOrder({ businessId, orderId, eventService }) {
    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId }],
      businessId
    });
    if (!order) return { success: false, responseText: 'Order not found' };

    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.statusHistory.push({ status: 'delivered', changedBy: 'owner', changedAt: new Date() });
    await order.save();

    if (eventService) {
      eventService.orderStatusChanged(
        order.customerPhone,
        order.orderId,
        'delivered',
        'Order deliver ho gaya! Dhanyavaad! 🙏'
      );
    }

    return {
      success: true,
      data: { order: order.toObject() },
      responseText: `Order ${orderId} delivered.`
    };
  }

  /**
   * List orders with optional filters.
   */
  async listOrders({ businessId, status, limit = 20, page = 1 }) {
    const query = { businessId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    return {
      success: true,
      data: {
        orders,
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      responseText: `Found ${total} orders${status ? ` with status "${status}"` : ''}.`
    };
  }
}

export default OrderManagerAgent;

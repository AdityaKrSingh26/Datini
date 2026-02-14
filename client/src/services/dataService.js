import apiService from './apiService';

const USE_MOCK = false; // Set to true to use mock data, false to use real API

class DataService {
  constructor() {
    this.useMock = USE_MOCK;
  }

  async getDashboardData() {
    try {
      return await apiService.getDashboard();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  async getProducts(filters = {}) {
    try {
      return await apiService.getProducts(filters);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      return await apiService.getProductById(id);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw error;
    }
  }

  async getStockAlerts() {
    try {
      return await apiService.getStockAlerts();
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error);
      throw error;
    }
  }

  async updateProductStock(productId, quantity, reason = 'manual_adjustment') {
    try {
      return await apiService.updateProductStock(productId, quantity, reason);
    } catch (error) {
      console.error('Failed to update product stock:', error);
      throw error;
    }
  }

  async getOrders(statusFilter = null) {
    try {
      return await apiService.getOrders(statusFilter);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      return await apiService.getOrderById(id);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, newStatus) {
    try {
      return await apiService.updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      return await apiService.createOrder(orderData);
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  async getCustomers(filters = {}) {
    try {
      return await apiService.getCustomers(filters);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      throw error;
    }
  }

  async getCustomerById(id) {
    try {
      return await apiService.getCustomerById(id);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      throw error;
    }
  }

  async getCustomerByPhone(phone) {
    try {
      return await apiService.getCustomerByPhone(phone);
    } catch (error) {
      console.error('Failed to fetch customer by phone:', error);
      throw error;
    }
  }

  async updateCustomerCredit(customerId, amount, note) {
    try {
      return await apiService.updateCustomerCredit(customerId, amount, note);
    } catch (error) {
      console.error('Failed to update customer credit:', error);
      throw error;
    }
  }

  async getInsights() {
    try {
      return await apiService.getInsights();
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      throw error;
    }
  }

  async getChatSession(phone) {
    try {
      return await apiService.getChatSession(phone);
    } catch (error) {
      console.error('Failed to fetch chat session:', error);
      throw error;
    }
  }

  async sendChatMessage(sessionId, message) {
    try {
      return await apiService.sendChatMessage(sessionId, message);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  async processVoiceCommand(audioBlob, language = 'hi') {
    try {
      return await apiService.processVoiceCommand(audioBlob, language);
    } catch (error) {
      console.error('Failed to process voice command:', error);
      throw error;
    }
  }
}

export default new DataService();

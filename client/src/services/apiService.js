const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  }

  // Orders
  async getOrders(status = null) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/orders${query}`);
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  async updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Inventory
  async getProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/inventory${query}`);
  }

  async getProductById(id) {
    return this.request(`/inventory/${id}`);
  }

  async updateProductStock(id, quantity, reason) {
    return this.request(`/inventory/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, reason }),
    });
  }

  async getStockAlerts() {
    return this.request('/inventory/alerts');
  }

  // Customers
  async getCustomers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.creditOnly) {
      params.append('creditOnly', 'true');
    }
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/customers${query}`);
  }

  async getCustomerById(id) {
    return this.request(`/customers/${id}`);
  }

  async getCustomerByPhone(phone) {
    return this.request(`/customers/phone/${phone}`);
  }

  async updateCustomerCredit(id, amount, note) {
    return this.request(`/customers/${id}/credit`, {
      method: 'PUT',
      body: JSON.stringify({ amount, note }),
    });
  }

  // Insights
  async getInsights() {
    return this.request('/insights');
  }

  async getWeeklySales() {
    return this.request('/insights/weekly-sales');
  }

  async getTopProducts() {
    return this.request('/insights/top-products');
  }

  // GST
  async getGstReport(month, year) {
    return this.request(`/gst/report?month=${month}&year=${year}`);
  }

  // Chat
  async sendChatMessage(sessionId, message) {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    });
  }

  async getChatSession(phone) {
    return this.request(`/chat/session/${phone}`);
  }

  // Voice Commands
  async processVoiceCommand(audioBlob, language = 'hi') {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-command.wav');
    formData.append('language', language);

    return this.request('/voice-command/process', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it with boundary
    });
  }
}

export default new ApiService();

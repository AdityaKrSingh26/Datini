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
    const res = await this.request('/dashboard');
    return res?.data ?? res;
  }

  // Orders — server returns { success, data: { orders, total, page, pages } }
  async getOrders(status = null) {
    const query = status ? `?status=${status}` : '';
    const res = await this.request(`/orders${query}`);
    return res?.data ?? res;
  }

  async getOrderById(id) {
    const res = await this.request(`/orders/${id}`);
    return res?.data ?? res;
  }

  async updateOrderStatus(id, status) {
    const res = await this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res?.data ?? res;
  }

  async createOrder(orderData) {
    const res = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return res?.data ?? res;
  }

  // Inventory — server returns { success, data: { products, lowStock, outOfStock, ... } }
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
    const res = await this.request(`/inventory${query}`);
    return res?.data ?? res;
  }

  async getProductById(id) {
    const res = await this.request(`/inventory/${id}`);
    return res?.data ?? res;
  }

  async updateProductStock(id, quantity, reason) {
    return this.request(`/inventory/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, reason }),
    });
  }

  async getStockAlerts() {
    const data = await this.getProducts({});
    const low = data?.lowStock ?? [];
    const out = data?.outOfStock ?? [];
    return Array.isArray(low) && Array.isArray(out) ? [...low, ...out] : [];
  }

  // Customers — server returns { success, data: { customers, total } }
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
    const res = await this.request(`/customers${query}`);
    const data = res?.data ?? res;
    return Array.isArray(data?.customers) ? data.customers : (Array.isArray(data) ? data : []);
  }

  async getCustomerById(id) {
    const res = await this.request(`/customers/${id}`);
    return res?.data ?? res;
  }

  async getCustomerByPhone(phone) {
    const res = await this.request(`/customers/phone/${phone}`);
    return res?.data ?? res;
  }

  async updateCustomerCredit(id, amount, note) {
    const res = await this.request(`/customers/${id}/credit`, {
      method: 'PUT',
      body: JSON.stringify({ amount, note }),
    });
    return res?.data ?? res;
  }

  /** POST /api/customers/:id/remind - send credit reminder */
  async sendCustomerReminder(id) {
    const res = await this.request(`/customers/${id}/remind`, { method: 'POST' });
    return res?.data ?? res;
  }

  // Insights — server has GET /insights/weekly, returns { success, data: { dailySales, topProducts, summary, ... } }
  async getInsights() {
    const res = await this.request('/insights/weekly');
    return res?.data ?? res;
  }

  async getWeeklySales() {
    const res = await this.getInsights();
    return res?.dailySales ?? res?.weeklyData ?? [];
  }

  async getTopProducts() {
    const res = await this.getInsights();
    return res?.topProducts ?? [];
  }

  // GST
  async getGstReport(month, year) {
    return this.request(`/gst/report?month=${month}&year=${year}`);
  }

  // Chat — server expects { phone, text, businessId? }
  async sendChatMessage(phone, text) {
    const res = await this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ phone, text }),
    });
    return res?.data ?? res;
  }

  async getChatSession(phone) {
    const res = await this.request(`/chat/session/${phone}`);
    return res?.data ?? res;
  }

  // Voice — server expects POST /api/voice-command with JSON { audioText, language }
  async processVoiceCommand(audioText, language = 'hi') {
    const text = typeof audioText === 'string' ? audioText : '';
    const res = await this.request('/voice-command', {
      method: 'POST',
      body: JSON.stringify({ audioText: text || ' ', language }),
    });
    return res?.data ?? res;
  }
}

export default new ApiService();

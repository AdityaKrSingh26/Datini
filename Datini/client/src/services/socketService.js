import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(businessId) {
    if (this.socket && this.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('✅ Socket connected:', this.socket.id);

      // Join business room if businessId provided
      if (businessId) {
        this.socket.emit('join:business', businessId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  joinBusinessRoom(businessId) {
    if (this.socket && this.connected) {
      this.socket.emit('join:business', businessId);
    }
  }

  joinSessionRoom(sessionId) {
    if (this.socket && this.connected) {
      this.socket.emit('join:session', sessionId);
    }
  }

  /** Optional: for testing; no-op if server does not implement. */
  simulateOrderStatusChange(orderId, status) {
    if (this.socket && this.connected) {
      this.socket.emit('order_status_changed', { orderId, status });
    }
  }
}

export default new SocketService();

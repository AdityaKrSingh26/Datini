export const ROUTES = {
  DASHBOARD: '/',
  ORDERS: '/orders',
  INVENTORY: '/inventory',
  CUSTOMERS: '/customers',
  INSIGHTS: '/insights',
  CHATBOT: '/chatbot',
  DEMO: '/demo',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_TABS = {
  INCOMING: 'incoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

export const PRODUCT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'grains', label: 'Grains' },
  { value: 'pulses', label: 'Pulses' },
  { value: 'oils', label: 'Oils & Ghee' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'instant', label: 'Instant Food' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'personal_care', label: 'Personal Care' },
];

export const PAYMENT_METHODS = {
  UPI: 'upi',
  CASH: 'cash',
  CREDIT: 'credit',
  CARD: 'card',
};

export const ORDER_SOURCES = {
  CHATBOT: 'chatbot',
  PHONE: 'phone',
  WALK_IN: 'walk_in',
};

export const CUSTOMER_SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'totalSpent', label: 'Total Spent (High to Low)' },
  { value: 'creditBalance', label: 'Credit Balance (High to Low)' },
  { value: 'lastOrder', label: 'Last Order (Recent First)' },
];

export const INVENTORY_SORT_OPTIONS = [
  { value: 'stock', label: 'Stock Level' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'category', label: 'Category' },
  { value: 'price', label: 'Price (High to Low)' },
];

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const SOCKET_EVENTS = {
  NEW_ORDER: 'new_order',
  ORDER_STATUS_CHANGED: 'order_status_changed',
  STOCK_ALERT: 'stock_alert',
  DAILY_SUMMARY: 'daily_summary',
  CREDIT_REMINDER_SENT: 'credit_reminder_sent',
};

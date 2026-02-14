import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatTime = (timestamp) => {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return `Today ${format(date, 'h:mm a')}`;
  }

  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }

  return format(date, 'MMM d, h:mm a');
};

export const formatRelativeTime = (timestamp) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const formatPhone = (phone) => {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

export const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    accepted: 'Accepted',
    preparing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return statusMap[status] || status;
};

export const getStatusColor = (status) => {
  const colorMap = {
    pending: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    preparing: 'bg-yellow-100 text-yellow-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-600 text-white',
    cancelled: 'bg-red-100 text-red-800',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getStockStatus = (currentStock, reorderLevel) => {
  if (currentStock === 0) {
    return { status: 'out', color: 'text-red-600', label: 'Out of Stock' };
  } else if (currentStock <= reorderLevel) {
    return { status: 'critical', color: 'text-red-600', label: 'Critical' };
  } else if (currentStock <= reorderLevel * 2) {
    return { status: 'warning', color: 'text-yellow-600', label: 'Low Stock' };
  }
  return { status: 'healthy', color: 'text-green-600', label: 'Healthy' };
};

export const getDaysLeft = (currentStock, reorderLevel, avgDailySales = 5) => {
  if (currentStock === 0) return 0;
  return Math.floor(currentStock / avgDailySales);
};

export const getCategoryLabel = (category) => {
  const categoryMap = {
    grains: 'Grains',
    pulses: 'Pulses',
    oils: 'Oils & Ghee',
    dairy: 'Dairy',
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    snacks: 'Snacks',
    instant: 'Instant Food',
    beverages: 'Beverages',
    cleaning: 'Cleaning',
    personal_care: 'Personal Care',
  };

  return categoryMap[category] || category;
};

export const getPaymentMethodIcon = (method) => {
  const iconMap = {
    upi: '📱',
    cash: '💵',
    credit: '📝',
    card: '💳',
  };

  return iconMap[method] || '💰';
};

export const getSourceIcon = (source) => {
  const iconMap = {
    chatbot: '💬',
    phone: '📞',
    walk_in: '🚶',
  };

  return iconMap[source] || '🛒';
};

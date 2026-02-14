import Card from '../common/Card';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatRelativeTime, formatPhone, getPaymentMethodIcon, getSourceIcon } from '../../utils/formatters';
import { User, Clock } from 'lucide-react';

const OrderCard = ({ order, onClick }) => {
  return (
    <Card hoverable onClick={onClick} variant="gradient" className="group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-gray-900">{order.orderId}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-700">
              <User size={14} className="text-gray-400" />
              <span className="font-medium">{order.customerName}</span>
            </div>
            <p className="text-xs text-gray-500 pl-5">{formatPhone(order.customerPhone)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            {formatCurrency(order.grandTotal)}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="px-2 py-1 bg-gray-100 rounded-lg font-medium">
            {order.items.length} items
          </span>
          <span>{getPaymentMethodIcon(order.paymentMethod)}</span>
          <span>{getSourceIcon(order.source)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} />
          <span>{formatRelativeTime(order.createdAt)}</span>
        </div>
      </div>
    </Card>
  );
};

export default OrderCard;

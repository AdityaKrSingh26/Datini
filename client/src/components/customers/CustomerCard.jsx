import { Send, Phone, TrendingUp, CreditCard } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrency, formatPhone, formatTime } from '../../utils/formatters';

const CustomerCard = ({ customer, onSendReminder, reminderSent }) => {
  const hasCredit = customer.creditBalance > 0;

  return (
    <Card variant="gradient" className="group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-gray-900 text-lg">{customer.name}</h3>
            <Badge variant={customer.languagePref === 'hi' ? 'primary' : 'info'} size="sm">
              {customer.languagePref.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Phone size={14} className="text-gray-400" />
            {formatPhone(customer.phone)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-xl font-bold text-gray-900">{customer.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <TrendingUp size={12} />
            Total Spent
          </p>
          <p className="text-xl font-bold text-success-600">{formatCurrency(customer.totalSpent)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <CreditCard size={12} />
            Credit Balance
          </p>
          <p className={`text-xl font-bold ${hasCredit ? 'text-danger-600' : 'text-success-600'}`}>
            {formatCurrency(customer.creditBalance)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Credit Limit</p>
          <p className="text-xl font-bold text-gray-600">{formatCurrency(customer.creditLimit)}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200 text-xs text-gray-500 mb-3">
        Last order: <span className="font-medium text-gray-700">{formatTime(customer.lastOrderDate)}</span>
      </div>

      {hasCredit && (
        <Button
          onClick={() => onSendReminder(customer)}
          disabled={reminderSent}
          size="sm"
          variant="primary"
          className="w-full"
        >
          <div className="flex items-center justify-center gap-2">
            <Send size={16} />
            {reminderSent ? 'Reminder Sent ✓' : 'Send Payment Reminder'}
          </div>
        </Button>
      )}
    </Card>
  );
};

export default CustomerCard;

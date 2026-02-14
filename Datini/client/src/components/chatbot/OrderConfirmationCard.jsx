import { CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const OrderConfirmationCard = ({ orderId, items, grandTotal }) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] bg-white border-2 border-green-500 rounded-lg rounded-bl-none shadow-md overflow-hidden">
        <div className="bg-green-500 text-white px-4 py-3 flex items-center gap-2">
          <CheckCircle size={20} />
          <h3 className="font-semibold">Order Confirmed!</h3>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <p className="text-xs text-gray-500">Order ID</p>
            <p className="text-lg font-bold text-gray-800">{orderId}</p>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Items ({items.length})</p>
            <div className="text-sm text-gray-700">
              {items.map((item, idx) => (
                <span key={idx}>
                  {item.name}
                  {idx < items.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              <strong>Estimated Delivery:</strong> 30-45 minutes
            </p>
            <p className="text-xs text-green-700 mt-1">
              Dhanyavaad! Your order is being prepared. 🙏
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationCard;

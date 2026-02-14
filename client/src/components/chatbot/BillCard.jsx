import { formatCurrency } from '../../utils/formatters';
import clsx from 'clsx';

const BillCard = ({ items, subtotal, gstTotal, grandTotal, timestamp, onConfirm, onReject }) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] bg-green-50 border border-green-200 rounded-lg rounded-bl-none shadow-md overflow-hidden">
        <div className="bg-green-500 text-white px-4 py-2">
          <h3 className="font-semibold">Your Order</h3>
        </div>

        <div className="p-4 space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.name} ({item.quantity} {item.unit})
              </span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(item.price)}
              </span>
            </div>
          ))}

          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {gstTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST</span>
                <span className="font-medium">{formatCurrency(gstTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1 border-t">
              <span>Total</span>
              <span className="text-green-600">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 border-t">
          <p className="text-sm text-gray-600 mb-2">Confirm order?</p>
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Haan ✓
            </button>
            <button
              onClick={onReject}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Na ✗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillCard;

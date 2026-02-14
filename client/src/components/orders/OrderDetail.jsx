import Modal from '../common/Modal';
import Button from '../common/Button';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatTime, formatPhone, getPaymentMethodIcon, getSourceIcon } from '../../utils/formatters';
import { ORDER_STATUS } from '../../utils/constants';

const OrderDetail = ({ order, onClose, onAccept, onReject, onMarkDelivered }) => {
  if (!order) return null;

  const canAccept = order.status === ORDER_STATUS.PENDING;
  const canReject = order.status === ORDER_STATUS.PENDING;
  const canDeliver = [
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.OUT_FOR_DELIVERY,
  ].includes(order.status);

  return (
    <Modal isOpen={!!order} onClose={onClose} title="Order Details" size="lg">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{order.orderId}</h3>
            <p className="text-gray-600 mt-1">{order.customerName}</p>
            <p className="text-sm text-gray-500">{formatPhone(order.customerPhone)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Order Time</p>
            <p className="text-sm font-medium">{formatTime(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Method</p>
            <p className="text-sm font-medium">
              {getPaymentMethodIcon(order.paymentMethod)} {order.paymentMethod.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Source</p>
            <p className="text-sm font-medium">
              {getSourceIcon(order.source)} {order.source.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Items</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm">{item.name}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.gstTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST</span>
              <span className="font-medium">{formatCurrency(order.gstTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Grand Total</span>
            <span className="text-primary-500">{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          {canAccept && (
            <Button onClick={onAccept} variant="success" className="flex-1">
              Accept Order
            </Button>
          )}
          {canReject && (
            <Button onClick={onReject} variant="danger" className="flex-1">
              Reject Order
            </Button>
          )}
          {canDeliver && (
            <Button onClick={onMarkDelivered} variant="success" className="flex-1">
              Mark as Delivered
            </Button>
          )}
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderDetail;

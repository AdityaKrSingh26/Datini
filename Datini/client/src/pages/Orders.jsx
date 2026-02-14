import { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import OrderTabs from '../components/orders/OrderTabs';
import OrderCard from '../components/orders/OrderCard';
import OrderDetail from '../components/orders/OrderDetail';
import Spinner from '../components/common/Spinner';
import dataService from '../services/dataService';
import { ORDER_TABS, ORDER_STATUS, TOAST_TYPES } from '../utils/constants';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { SOCKET_EVENTS } from '../utils/constants';

const TAB_TO_STATUS = {
  [ORDER_TABS.INCOMING]: ORDER_STATUS.PENDING,
  [ORDER_TABS.ACTIVE]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY].join(','),
  [ORDER_TABS.COMPLETED]: ORDER_STATUS.DELIVERED,
};

const Orders = () => {
  const [activeTab, setActiveTab] = useState(ORDER_TABS.INCOMING);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [counts, setCounts] = useState({ incoming: 0, active: 0, completed: 0 });
  const socket = useSocket();
  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    setError(false);
    try {
      const status = TAB_TO_STATUS[activeTab];
      const result = await dataService.getOrders(status);
      const list = Array.isArray(result?.orders) ? result.orders : (Array.isArray(result) ? result : []);
      setOrders(list);

      const [incomingRes, activeRes, completedRes] = await Promise.all([
        dataService.getOrders(ORDER_STATUS.PENDING),
        dataService.getOrders([ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY].join(',')),
        dataService.getOrders(ORDER_STATUS.DELIVERED),
      ]);
      setCounts({
        incoming: Array.isArray(incomingRes?.orders) ? incomingRes.orders.length : (incomingRes?.total ?? 0),
        active: Array.isArray(activeRes?.orders) ? activeRes.orders.length : (activeRes?.total ?? 0),
        completed: Array.isArray(completedRes?.orders) ? completedRes.orders.length : (completedRes?.total ?? 0),
      });
    } catch (err) {
      console.error('Error loading orders:', err);
      showToast('Failed to load orders', TOAST_TYPES.ERROR);
      setOrders([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  useEffect(() => {
    const handleNewOrder = (order) => {
      if (activeTab === ORDER_TABS.INCOMING) {
        loadOrders();
      }
    };

    const handleOrderStatusChange = () => {
      loadOrders();
    };

    socket.on(SOCKET_EVENTS.NEW_ORDER, handleNewOrder);
    socket.on(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_ORDER, handleNewOrder);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChange);
    };
  }, [socket, activeTab]);

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    try {
      await dataService.updateOrderStatus(selectedOrder._id, ORDER_STATUS.ACCEPTED);
      if (socket.simulateOrderStatusChange) socket.simulateOrderStatusChange(selectedOrder._id, ORDER_STATUS.ACCEPTED);
      showToast('Order accepted successfully!', TOAST_TYPES.SUCCESS);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      showToast('Failed to update order', TOAST_TYPES.ERROR);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    try {
      await dataService.updateOrderStatus(selectedOrder._id, ORDER_STATUS.CANCELLED);
      if (socket.simulateOrderStatusChange) socket.simulateOrderStatusChange(selectedOrder._id, ORDER_STATUS.CANCELLED);
      showToast('Order cancelled', TOAST_TYPES.INFO);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      showToast('Failed to update order', TOAST_TYPES.ERROR);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    try {
      await dataService.updateOrderStatus(selectedOrder._id, ORDER_STATUS.DELIVERED);
      if (socket.simulateOrderStatusChange) socket.simulateOrderStatusChange(selectedOrder._id, ORDER_STATUS.DELIVERED);
      showToast('Order marked as delivered!', TOAST_TYPES.SUCCESS);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      showToast('Failed to update order', TOAST_TYPES.ERROR);
    }
  };

  return (
    <PageLayout title="Orders" pendingCount={counts.incoming}>
      <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <p className="text-gray-500">Could not load orders. Make sure the server is running.</p>
          <button
            type="button"
            onClick={loadOrders}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      )}

      <OrderDetail
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        onMarkDelivered={handleMarkDelivered}
      />
    </PageLayout>
  );
};

export default Orders;

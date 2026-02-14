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

const Orders = () => {
  const [activeTab, setActiveTab] = useState(ORDER_TABS.INCOMING);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const socket = useSocket();
  const { showToast } = useToast();

  const loadOrders = () => {
    setLoading(true);
    setTimeout(() => {
      const orderData = dataService.getOrders(activeTab);
      setOrders(orderData);

      const incomingOrders = dataService.getOrders(ORDER_TABS.INCOMING);
      const activeOrders = dataService.getOrders(ORDER_TABS.ACTIVE);
      const completedOrders = dataService.getOrders(ORDER_TABS.COMPLETED);

      setCounts({
        incoming: incomingOrders.length,
        active: activeOrders.length,
        completed: completedOrders.length,
      });

      setLoading(false);
    }, 300);
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

  const handleAcceptOrder = () => {
    if (selectedOrder) {
      dataService.updateOrderStatus(selectedOrder._id, ORDER_STATUS.ACCEPTED);
      socket.simulateOrderStatusChange(selectedOrder._id, ORDER_STATUS.ACCEPTED);
      showToast('Order accepted successfully!', TOAST_TYPES.SUCCESS);
      setSelectedOrder(null);
      loadOrders();
    }
  };

  const handleRejectOrder = () => {
    if (selectedOrder) {
      dataService.updateOrderStatus(selectedOrder._id, ORDER_STATUS.CANCELLED);
      socket.simulateOrderStatusChange(selectedOrder._id, ORDER_STATUS.CANCELLED);
      showToast('Order cancelled', TOAST_TYPES.INFO);
      setSelectedOrder(null);
      loadOrders();
    }
  };

  const handleMarkDelivered = () => {
    if (selectedOrder) {
      dataService.updateOrderStatus(selectedOrder._id, ORDER_STATUS.DELIVERED);
      socket.simulateOrderStatusChange(selectedOrder._id, ORDER_STATUS.DELIVERED);
      showToast('Order marked as delivered!', TOAST_TYPES.SUCCESS);
      setSelectedOrder(null);
      loadOrders();
    }
  };

  return (
    <PageLayout title="Orders" pendingCount={counts.incoming}>
      <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
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

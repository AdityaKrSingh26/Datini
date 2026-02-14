import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package, ShoppingCart, FileText, CreditCard, MessageSquare } from 'lucide-react';
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import DataCard from '../components/dashboard/DataCard';
import MessageBubble from '../components/chatbot/MessageBubble';
import BillCard from '../components/chatbot/BillCard';
import OrderConfirmationCard from '../components/chatbot/OrderConfirmationCard';
import TypingIndicator from '../components/chatbot/TypingIndicator';
import ChatInput from '../components/chatbot/ChatInput';
import { SkeletonCard } from '../components/common/Skeleton';
import dataService from '../services/dataService';
import { formatCurrency, formatRelativeTime } from '../utils/formatters';
import { ROUTES } from '../utils/constants';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { SOCKET_EVENTS, TOAST_TYPES } from '../utils/constants';
import { normalizeDashboardData } from '../utils/dashboardData';

const Demo = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingBill, setPendingBill] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const socket = useSocket();
  const { showToast } = useToast();

  const loadDashboardData = async () => {
    setError(false);
    try {
      const raw = await dataService.getDashboardData();
      setDashboardData(normalizeDashboardData(raw));
    } catch (err) {
      setDashboardData(null);
      setError(true);
    }
  };

  useEffect(() => {
    const welcomeMessage = {
      text: 'Namaste! 🙏 Sharma General Store mein aapka swagat hai. Aaj kya mangwana hai?',
      timestamp: new Date().toISOString(),
      isUser: false,
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadDashboardData().finally(() => { if (!cancelled) setLoading(false); });
    dataService.getProducts({}).then((data) => {
      if (cancelled) return;
      const list = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
      setProducts(list);
    }).catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleNewOrder = (order) => {
      showToast(`New order from ${order?.customerName ?? 'customer'}!`, TOAST_TYPES.INFO);
      loadDashboardData();
    };

    const handleOrderStatusChange = () => {
      loadDashboardData();
    };

    socket.on(SOCKET_EVENTS.NEW_ORDER, handleNewOrder);
    socket.on(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_ORDER, handleNewOrder);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChange);
    };
  }, [socket, showToast]);

  const parseOrder = (text, productList) => {
    const list = productList ?? products;
    const lowerText = text.toLowerCase();
    const foundItems = [];
    list.forEach((product) => {
      const aliases = Array.isArray(product.aliases) ? product.aliases : (product.nameEn ? [product.nameEn] : []);
      aliases.forEach((alias) => {
        if (alias && lowerText.includes(String(alias).toLowerCase())) {
          const quantityMatch = lowerText.match(new RegExp(`(\\d+\\.?\\d*)\\s*(?:kilo|kg|liter|litre|packet|piece|dozen)?\\s*${String(alias).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
          const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1;
          const existingItem = foundItems.find((item) => item.productId === product._id);
          if (!existingItem) {
            foundItems.push({
              productId: product._id,
              name: product.nameEn ?? product.name ?? 'Item',
              quantity,
              unit: product.unit ?? 'units',
              price: (product.pricePerUnit ?? 0) * quantity,
              gstRate: product.gstRate ?? 0,
            });
          }
        }
      });
    });
    return foundItems;
  };

  const handleSendMessage = (text) => {
    const userMessage = {
      text,
      timestamp: new Date().toISOString(),
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);
    setTimeout(() => {
      const items = parseOrder(text, products);

      if (items.length > 0) {
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        const gstTotal = items.reduce((sum, item) => sum + (item.price * item.gstRate) / 100, 0);
        const grandTotal = subtotal + gstTotal;

        setPendingBill({
          items,
          subtotal,
          gstTotal,
          grandTotal,
          timestamp: new Date().toISOString(),
        });
      } else {
        const botMessage = {
          text: 'Maaf kijiye, main samjha nahi. Kripya item ka naam bataiye jaise "2 kilo chawal" ya "maggi".',
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        setMessages((prev) => [...prev, botMessage]);
      }

      setIsTyping(false);
    }, 1500);
  };

  const handleConfirmOrder = async () => {
    if (!pendingBill) return;
    try {
      const newOrder = await dataService.createOrder({
        customerPhone: '+919123456789',
        customerName: 'Demo Customer',
        items: pendingBill.items,
        subtotal: pendingBill.subtotal,
        gstTotal: pendingBill.gstTotal,
        grandTotal: pendingBill.grandTotal,
        paymentMethod: 'upi',
        source: 'chatbot',
      });

      setConfirmedOrder(newOrder?.data ?? newOrder);
      setPendingBill(null);

      if (socket.emit) socket.emit('new_order', newOrder);

      setTimeout(() => {
        const botMessage = {
          text: 'Kuch aur chahiye?',
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 2000);
    } catch (err) {
      setMessages((prev) => [...prev, {
        text: 'Order place nahi ho paya. Phir se try karein.',
        timestamp: new Date().toISOString(),
        isUser: false,
      }]);
    }
  };

  const handleRejectOrder = () => {
    setPendingBill(null);

    const botMessage = {
      text: 'Koi baat nahi. Aap kya mangwana chahte hain?',
      timestamp: new Date().toISOString(),
      isUser: false,
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const quickActions = confirmedOrder
    ? []
    : pendingBill
    ? []
    : ['Namaste', '2 kilo chawal', 'Maggi', 'Parle-G'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading demo...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4 px-4">
        <p className="text-gray-600 text-center">Could not load demo. Make sure the server is running.</p>
        <button
          type="button"
          onClick={() => { setLoading(true); loadDashboardData().finally(() => setLoading(false)); }}
          className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const safeData = dashboardData ?? normalizeDashboardData({});

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-primary-500 text-white px-6 py-4 shadow-md">
        <h1 className="text-2xl font-bold">Datini Demo</h1>
        <p className="text-sm text-primary-100">Real-time sync demonstration</p>
      </div>

      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
        <p className="text-sm text-yellow-800">
          <strong>Try it:</strong> Place an order on the right — watch the dashboard update in real-time on the left!
        </p>
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 flex-1 overflow-hidden">
        <div className="border-r bg-gray-50 overflow-y-auto p-6">
          <WelcomeHeader
            ownerName={safeData.business.ownerName}
            storeName={safeData.business.name}
          />

          <div className="grid grid-cols-1 gap-4">
            <DataCard
              title="Today's P&L"
              icon={TrendingUp}
              onClick={() => navigate(ROUTES.INSIGHTS)}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sales</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(safeData.todayPL.sales)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Expenses</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(safeData.todayPL.expenses)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold text-gray-700">Profit</span>
                <span className="text-xl font-bold text-primary-500">
                  {formatCurrency(safeData.todayPL.profit)}
                </span>
              </div>
            </DataCard>

            <DataCard
              title="Pending Orders"
              icon={ShoppingCart}
              onClick={() => navigate(ROUTES.ORDERS)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-blue-600">
                  {safeData.pendingOrderCount}
                </span>
                <span className="text-sm text-gray-600">Awaiting Action</span>
              </div>
              {safeData.pendingOrders.length > 0 && (
                <div className="space-y-1 text-sm">
                  {safeData.pendingOrders.map((order) => (
                    <div key={order._id} className="flex justify-between">
                      <span className="text-gray-700">{order.customerName}</span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800">
                          {formatCurrency(order.grandTotal)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatRelativeTime(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DataCard>

            <DataCard
              title="Inventory Alerts"
              icon={Package}
              onClick={() => navigate(ROUTES.INVENTORY)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-yellow-600">
                  {safeData.stockAlertCount}
                </span>
                <span className="text-sm text-gray-600">Low/Out of Stock</span>
              </div>
              {safeData.stockAlerts.length > 0 && (
                <div className="space-y-1 text-sm">
                  {safeData.stockAlerts.map((product) => (
                    <div
                      key={product._id}
                      className="flex justify-between text-gray-700"
                    >
                      <span>{product.nameEn}</span>
                      <span className="font-semibold text-red-600">
                        {product.currentStock} {product.unit ?? 'units'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </DataCard>
          </div>
        </div>

        <div className="flex flex-col bg-gray-100">
          <div className="bg-primary-500 text-white px-4 py-3 shadow-md flex items-center gap-3">
            <MessageSquare size={24} />
            <div>
              <h2 className="font-semibold">Sharma Kirana Store</h2>
              <p className="text-xs text-primary-100">WhatsApp Ordering</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} isUser={msg.isUser} />
            ))}

            {isTyping && <TypingIndicator />}

            {pendingBill && (
              <BillCard
                items={pendingBill.items}
                subtotal={pendingBill.subtotal}
                gstTotal={pendingBill.gstTotal}
                grandTotal={pendingBill.grandTotal}
                timestamp={pendingBill.timestamp}
                onConfirm={handleConfirmOrder}
                onReject={handleRejectOrder}
              />
            )}

            {confirmedOrder && (
              <OrderConfirmationCard
                orderId={confirmedOrder.orderId}
                items={confirmedOrder.items}
                grandTotal={confirmedOrder.grandTotal}
              />
            )}
          </div>

          <ChatInput onSend={handleSendMessage} quickActions={quickActions} />
        </div>
      </div>

      <div className="lg:hidden flex items-center justify-center flex-1 p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Desktop Only</h2>
          <p className="text-gray-600">
            Please view this demo on a desktop (1024px+) to see the split-screen experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Demo;

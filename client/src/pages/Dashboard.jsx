import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package, ShoppingCart, FileText, CreditCard } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import DataCard from '../components/dashboard/DataCard';
import { SkeletonCard } from '../components/common/Skeleton';
import dataService from '../services/dataService';
import { formatCurrency, formatRelativeTime } from '../utils/formatters';
import { ROUTES } from '../utils/constants';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { SOCKET_EVENTS, TOAST_TYPES } from '../utils/constants';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socket = useSocket();
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const dashboardData = await dataService.getDashboardData();
      setData(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Failed to load dashboard data', TOAST_TYPES.ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleNewOrder = (order) => {
      showToast(`New order from ${order.customerName}!`, TOAST_TYPES.INFO);
      loadData();
    };

    const handleOrderStatusChange = () => {
      loadData();
    };

    socket.on(SOCKET_EVENTS.NEW_ORDER, handleNewOrder);
    socket.on(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_ORDER, handleNewOrder);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChange);
    };
  }, [socket, showToast]);

  if (loading) {
    return (
      <PageLayout title="Datini">
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Datini"
      pendingCount={data.pendingOrderCount}
      stockAlertCount={data.stockAlertCount}
      notificationCount={data.pendingOrderCount + data.stockAlertCount}
    >
      <WelcomeHeader
        ownerName={data.business.ownerName}
        storeName={data.business.name}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DataCard
          title="Today's P&L"
          icon={TrendingUp}
          onClick={() => navigate(ROUTES.INSIGHTS)}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-dark-400 font-mono uppercase tracking-wider">Sales</span>
            <span className="text-xl font-display text-success-600 tracking-tight">
              {formatCurrency(data.todayPL.sales)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-dark-400 font-mono uppercase tracking-wider">Expenses</span>
            <span className="text-xl font-display text-danger-600 tracking-tight">
              {formatCurrency(data.todayPL.expenses)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t-3 border-dark-500 mt-2">
            <span className="text-sm font-display text-dark-500">PROFIT</span>
            <span className="text-2xl font-display text-primary-600 tracking-tight">
              {formatCurrency(data.todayPL.profit)}
            </span>
          </div>
        </DataCard>

        <DataCard
          title="Inventory Alerts"
          icon={Package}
          onClick={() => navigate(ROUTES.INVENTORY)}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl font-display text-warning-600 tracking-tight">
              {data.stockAlertCount}
            </span>
            <span className="text-xs text-dark-400 font-mono font-bold tracking-wider text-right uppercase">LOW/OUT<br/>OF STOCK</span>
          </div>
          {data.stockAlerts.length > 0 && (
            <div className="space-y-2 text-sm">
              {data.stockAlerts.map((product) => (
                <div
                  key={product._id}
                  className="flex justify-between text-dark-500 py-1 border-b border-dark-200 last:border-0"
                >
                  <span className="font-medium">{product.nameEn}</span>
                  <span className="font-display text-danger-600">
                    {product.currentStock} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DataCard>

        <DataCard
          title="Pending Orders"
          icon={ShoppingCart}
          onClick={() => navigate(ROUTES.ORDERS)}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl font-display text-secondary-600 tracking-tight">
              {data.pendingOrderCount}
            </span>
            <span className="text-xs text-dark-400 font-mono font-bold tracking-wider text-right uppercase">AWAITING<br/>ACTION</span>
          </div>
          {data.pendingOrders.length > 0 && (
            <div className="space-y-2 text-sm">
              {data.pendingOrders.map((order) => (
                <div key={order._id} className="flex justify-between items-start py-1 border-b border-dark-200 last:border-0">
                  <span className="text-dark-500 font-medium">{order.customerName}</span>
                  <div className="text-right">
                    <div className="font-display text-dark-500 text-base">
                      {formatCurrency(order.grandTotal)}
                    </div>
                    <div className="text-[10px] text-dark-400 font-mono font-semibold tracking-wider">
                      {formatRelativeTime(order.createdAt).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataCard>

        <DataCard
          title="GST Status"
          icon={FileText}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark-400 font-mono uppercase tracking-wider">Net Payable</span>
              <span className="text-xl font-display text-primary-600 tracking-tight">
                {formatCurrency(data.gstStatus.netPayable)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark-400 font-mono uppercase tracking-wider">ITC Available</span>
              <span className="text-base font-display text-success-600">
                {formatCurrency(data.gstStatus.itcAvailable)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-3 border-dark-500 mt-2">
              <span className="text-xs text-dark-400 font-mono uppercase tracking-wider">Due Date</span>
              <span className="text-sm font-mono font-bold text-danger-600 tracking-wider">
                {new Date(data.gstStatus.dueDate).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>
        </DataCard>

        <DataCard
          title="Credit Outstanding"
          icon={CreditCard}
          onClick={() => navigate(ROUTES.CUSTOMERS)}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark-400 font-mono uppercase tracking-wider">Total Credit</span>
              <span className="text-xl font-display text-danger-600 tracking-tight">
                {formatCurrency(data.creditOutstanding.total)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark-400 font-mono uppercase tracking-wider">Top Debtor</span>
              <div className="text-right">
                <div className="text-sm font-medium text-dark-500">
                  {data.creditOutstanding.topDebtor}
                </div>
                <div className="text-base font-display text-danger-600">
                  {formatCurrency(data.creditOutstanding.topDebtorAmount)}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t-3 border-dark-500 text-xs font-mono text-dark-400 font-semibold tracking-wider uppercase">
              {data.creditOutstanding.customerCount} customers with pending credit
            </div>
          </div>
        </DataCard>
      </div>
    </PageLayout>
  );
};

export default Dashboard;

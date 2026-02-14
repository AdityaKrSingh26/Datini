import { Home, ShoppingCart, Package, Users, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import clsx from 'clsx';

const BottomNav = ({ pendingCount = 0, stockAlertCount = 0 }) => {
  const location = useLocation();

  const tabs = [
    { name: 'Home', icon: Home, path: ROUTES.DASHBOARD },
    { name: 'Orders', icon: ShoppingCart, path: ROUTES.ORDERS, badge: pendingCount },
    { name: 'Stock', icon: Package, path: ROUTES.INVENTORY, dot: stockAlertCount > 0 },
    { name: 'People', icon: Users, path: ROUTES.CUSTOMERS },
    { name: 'Data', icon: BarChart3, path: ROUTES.INSIGHTS },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-dark-500 md:hidden z-40">
      <div className="flex items-center justify-around px-1 py-3">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={clsx(
                'flex flex-col items-center justify-center px-2 py-1 transition-all relative min-w-[64px]',
                isActive
                  ? 'text-dark-500'
                  : 'text-dark-300 hover:text-dark-400'
              )}
            >
              <div className="relative">
                <div className={clsx(
                  'p-2 transition-all border-2',
                  isActive
                    ? 'bg-accent-500 border-dark-500 shadow-brutal-sm'
                    : 'bg-transparent border-transparent hover:border-dark-200'
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-[10px] font-mono font-bold border-2 border-dark-500 w-5 h-5 flex items-center justify-center shadow-brutal-sm">
                    {tab.badge > 9 ? '9' : tab.badge}
                  </span>
                )}
                {tab.dot && (
                  <span className="absolute -top-1 -right-1 bg-warning-500 w-3 h-3 border-2 border-dark-500" />
                )}
              </div>
              <span className={clsx(
                'text-[10px] mt-1 font-mono font-bold tracking-wider uppercase transition-all',
                isActive && 'text-dark-500'
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

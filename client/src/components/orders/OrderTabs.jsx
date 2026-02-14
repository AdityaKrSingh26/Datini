import clsx from 'clsx';
import { ORDER_TABS } from '../../utils/constants';

const OrderTabs = ({ activeTab, onTabChange, counts = {} }) => {
  const tabs = [
    { id: ORDER_TABS.INCOMING, label: 'Incoming', count: counts.incoming || 0 },
    { id: ORDER_TABS.ACTIVE, label: 'Active', count: counts.active || 0 },
    { id: ORDER_TABS.COMPLETED, label: 'Completed', count: counts.completed || 0 },
  ];

  return (
    <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-card border border-gray-200/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={clsx(
            'flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all relative',
            activeTab === tab.id
              ? 'gradient-primary text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {tab.label}
            {tab.count > 0 && (
              <span className={clsx(
                'px-2 py-0.5 text-xs rounded-full font-bold',
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-primary-50 text-primary-700'
              )}>
                {tab.count}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default OrderTabs;

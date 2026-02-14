import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import DataCard from '../dashboard/DataCard';
import { formatCurrency } from '../../utils/formatters';

const SummaryCards = ({ insights }) => {
  const weeklyData = insights?.weeklyData ?? [];
  const topProducts = insights?.topProducts ?? [];
  const totalRevenue = weeklyData.reduce((sum, day) => sum + (day.sales ?? 0), 0);
  const totalExpenses = weeklyData.reduce((sum, day) => sum + (day.expenses ?? 0), 0);
  const avgDailySale = weeklyData.length > 0 ? totalRevenue / weeklyData.length : 0;
  const topProduct = topProducts[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DataCard title="Total Revenue (Week)" icon={TrendingUp}>
        <p className="text-2xl font-bold text-green-600">
          {formatCurrency(totalRevenue)}
        </p>
        <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
      </DataCard>

      <DataCard title="Total Expenses (Week)" icon={TrendingDown}>
        <p className="text-2xl font-bold text-red-600">
          {formatCurrency(totalExpenses)}
        </p>
        <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
      </DataCard>

      <DataCard title="Average Daily Sale" icon={DollarSign}>
        <p className="text-2xl font-bold text-primary-500">
          {formatCurrency(avgDailySale)}
        </p>
        <p className="text-sm text-gray-500 mt-1">Per day average</p>
      </DataCard>

      <DataCard title="Best Selling Product" icon={Package}>
        {topProduct ? (
          <>
            <p className="text-lg font-bold text-gray-800">{topProduct.name}</p>
            <p className="text-sm text-primary-500 mt-1">
              {formatCurrency(topProduct.revenue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {topProduct.unitsSold ?? topProduct.quantity ?? 0} units sold
            </p>
          </>
        ) : (
          <p className="text-gray-500">No sales data yet</p>
        )}
      </DataCard>
    </div>
  );
};

export default SummaryCards;

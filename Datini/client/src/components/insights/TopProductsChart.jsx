import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

const TopProductsChart = ({ data }) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Products by Revenue</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `₹${value / 1000}k`} />
          <YAxis type="category" dataKey="name" width={100} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Bar dataKey="revenue" fill="#FF6B35" name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TopProductsChart;

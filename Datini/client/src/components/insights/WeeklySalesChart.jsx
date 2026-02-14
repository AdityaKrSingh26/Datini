import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

const WeeklySalesChart = ({ data }) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Sales & Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="sales" fill="#10B981" name="Sales" />
          <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default WeeklySalesChart;

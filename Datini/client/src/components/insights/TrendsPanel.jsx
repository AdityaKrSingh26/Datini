import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import Card from '../common/Card';

const TrendsPanel = ({ insights }) => {
  const topProducts = insights?.topProducts ?? [];
  const bestProduct = topProducts[0];
  const trends = [
    {
      icon: TrendingUp,
      color: 'text-green-600',
      text: 'Weekend sales are 40% higher than weekdays',
    },
    {
      icon: TrendingUp,
      color: 'text-green-600',
      text: bestProduct ? `${bestProduct.name} is your best performer this week` : 'Track sales to see top products',
    },
    {
      icon: Info,
      color: 'text-blue-600',
      text: 'Most orders come through WhatsApp chatbot',
    },
    {
      icon: TrendingDown,
      color: 'text-red-600',
      text: 'Stock replenishment needed for 5 items',
    },
    {
      icon: Info,
      color: 'text-blue-600',
      text: 'Average order value has increased by 15%',
    },
  ];

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Insights</h3>
      <div className="space-y-3">
        {trends.map((trend, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <trend.icon className={`flex-shrink-0 ${trend.color}`} size={20} />
            <p className="text-sm text-gray-700">{trend.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TrendsPanel;

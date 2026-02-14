import { getStockStatus } from '../../utils/formatters';

const StockIndicator = ({ currentStock, reorderLevel }) => {
  const { status, color, label } = getStockStatus(currentStock, reorderLevel);

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`} />
      <span className={`text-sm font-medium ${color}`}>{label}</span>
    </div>
  );
};

export default StockIndicator;

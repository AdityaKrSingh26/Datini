import { getStatusText, getStatusColor } from '../../utils/formatters';

const StatusBadge = ({ status }) => {
  const colorClasses = {
    pending: 'bg-blue-50 text-blue-700 border border-blue-200',
    accepted: 'bg-green-50 text-green-700 border border-green-200',
    preparing: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    out_for_delivery: 'bg-purple-50 text-purple-700 border border-purple-200',
    delivered: 'bg-green-100 text-green-800 border border-green-300 font-bold',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colorClasses[status] || 'bg-gray-100 text-gray-700'}`}>
      {getStatusText(status)}
    </span>
  );
};

export default StatusBadge;

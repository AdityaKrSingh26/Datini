import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { TOAST_TYPES } from '../../utils/constants';
import clsx from 'clsx';

const Toast = ({ message, type = TOAST_TYPES.INFO, onClose }) => {
  const config = {
    [TOAST_TYPES.SUCCESS]: {
      icon: CheckCircle,
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      iconColor: 'text-success-600',
      gradientFrom: 'from-success-500',
      gradientTo: 'to-success-600',
    },
    [TOAST_TYPES.ERROR]: {
      icon: XCircle,
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      iconColor: 'text-danger-600',
      gradientFrom: 'from-danger-500',
      gradientTo: 'to-danger-600',
    },
    [TOAST_TYPES.WARNING]: {
      icon: AlertCircle,
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      iconColor: 'text-warning-600',
      gradientFrom: 'from-warning-500',
      gradientTo: 'to-warning-600',
    },
    [TOAST_TYPES.INFO]: {
      icon: Info,
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      iconColor: 'text-secondary-600',
      gradientFrom: 'from-secondary-500',
      gradientTo: 'to-secondary-600',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, gradientFrom, gradientTo } = config[type];

  return (
    <div
      className={clsx(
        'flex items-center gap-3 p-4 rounded-xl border shadow-medium min-w-[300px] max-w-md',
        bgColor,
        borderColor,
        'animate-slide-in backdrop-blur-sm'
      )}
    >
      <div className={`p-2 rounded-lg bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
        <Icon className="text-white" size={20} />
      </div>
      <p className="flex-1 text-sm font-semibold text-gray-800">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/50 transition-colors"
      >
        <X size={16} className="text-gray-600" />
      </button>
    </div>
  );
};

export default Toast;

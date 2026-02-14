import clsx from 'clsx';

const Badge = ({ children, variant = 'default', className = '', size = 'md' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border border-gray-200',
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
    success: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    danger: 'bg-danger-50 text-danger-700 border border-danger-200',
    info: 'bg-secondary-50 text-secondary-700 border border-secondary-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-semibold',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;

import clsx from 'clsx';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const variants = {
    primary: 'gradient-primary text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105',
    secondary: 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-soft',
    danger: 'gradient-danger text-white shadow-lg shadow-danger-500/30 hover:shadow-xl hover:shadow-danger-500/40 hover:scale-105',
    success: 'gradient-success text-white shadow-lg shadow-success-500/30 hover:shadow-xl hover:shadow-success-500/40 hover:scale-105',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  const gradientDanger = variant === 'danger' ? 'bg-gradient-to-r from-danger-500 to-danger-600' : '';
  const gradientSuccess = variant === 'success' ? 'bg-gradient-to-r from-success-500 to-success-600' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-lg font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
};

export default Button;

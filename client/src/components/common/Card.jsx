import clsx from 'clsx';

const Card = ({ children, className = '', onClick, hoverable = false, variant = 'default' }) => {
  const variants = {
    default: 'bg-white border-3 border-dark-500',
    gradient: 'bg-white border-3 border-dark-500',
    elevated: 'bg-white border-3 border-dark-500',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-6 transition-all duration-200 shadow-brutal',
        hoverable && 'hover:shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 cursor-pointer active:shadow-brutal-sm active:translate-x-2 active:translate-y-2',
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;

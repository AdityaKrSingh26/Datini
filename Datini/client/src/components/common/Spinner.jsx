const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div
          className={`${sizes[size]} border-gray-200 border-t-primary-500 rounded-full animate-spin`}
        />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500/20 to-transparent animate-pulse" />
      </div>
    </div>
  );
};

export default Spinner;

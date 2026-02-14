const Skeleton = ({ className = '', variant = 'default' }) => {
  const variants = {
    default: 'h-4 w-full',
    text: 'h-4 w-3/4',
    title: 'h-6 w-1/2',
    circle: 'h-12 w-12 rounded-full',
    card: 'h-32 w-full',
  };

  return (
    <div
      className={`bg-gray-200 animate-pulse rounded ${variants[variant]} ${className}`}
    />
  );
};

export const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
    <Skeleton variant="title" />
    <Skeleton variant="text" />
    <Skeleton variant="text" />
    <Skeleton />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <Skeleton className="w-1/4" />
        <Skeleton className="w-1/4" />
        <Skeleton className="w-1/4" />
        <Skeleton className="w-1/4" />
      </div>
    ))}
  </div>
);

export default Skeleton;

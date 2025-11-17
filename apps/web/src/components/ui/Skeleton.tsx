import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
}

/**
 * Skeleton component - Animated placeholder for loading states
 * Creates a shimmer effect to indicate content is loading
 * More professional than spinners for content-heavy pages
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height = '1rem',
  circle = false,
  count = 1,
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  const baseClasses = 'bg-gray-200 animate-pulse';
  const circleClasses = circle ? 'rounded-full' : 'rounded-md';
  const customClasses = className;

  const skeletonStyle: React.CSSProperties = {
    width: widthStyle,
    height: heightStyle,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${circleClasses} ${customClasses}`}
          style={skeletonStyle}
        />
      ))}
    </>
  );
};

/**
 * SkeletonLine - Skeleton for a single line of text
 * Useful for titles, labels, etc.
 */
export const SkeletonLine: React.FC<{ width?: string | number; height?: string | number; className?: string }> = ({
  width = '100%',
  height = '1.25rem',
  className = '',
}) => (
  <Skeleton width={width} height={height} className={`mb-2 ${className}`} />
);

/**
 * SkeletonText - Skeleton for multiple lines of body text
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={className}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={i === lines - 1 ? '80%' : '100%'}
        height="1rem"
        className="mb-2"
      />
    ))}
  </div>
);

/**
 * SkeletonButton - Skeleton for button elements
 */
export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton width="100%" height="2.5rem" className={`rounded-md ${className}`} />
);

/**
 * SkeletonAvatar - Skeleton for avatar/profile images
 */
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => <Skeleton width={size} height={size} circle className={className} />;

/**
 * SkeletonCard - Skeleton for card layout
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <SkeletonLine width="70%" />
    <SkeletonText lines={3} className="mt-4" />
    <div className="flex gap-2 mt-6">
      <SkeletonButton />
      <SkeletonButton />
    </div>
  </div>
);

/**
 * SkeletonInput - Skeleton for form input fields
 */
export const SkeletonInput: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={className}>
    <SkeletonLine width="40%" />
    <Skeleton width="100%" height="2.5rem" className="rounded-md mt-2" />
  </div>
);

/**
 * SkeletonTable - Skeleton for table rows
 */
export const SkeletonTable: React.FC<{
  columns?: number;
  rows?: number;
  className?: string;
}> = ({ columns = 5, rows = 5, className = '' }) => (
  <div className={className}>
    {/* Header */}
    <div className="grid gap-4 mb-4 p-4 bg-gray-50 rounded-md" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonLine key={i} width="60%" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div
        key={rowIdx}
        className="grid gap-4 p-4 border-b border-gray-200"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIdx) => (
          <SkeletonLine key={colIdx} width={Math.random() > 0.5 ? '70%' : '90%'} />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;

import React from 'react';

/**
 * SkeletonLoader — autumn & root inspired loading placeholders.
 * Colors: timber browns, gold leaf, cream parchment.
 * Animation: slow pulse mimicking sap flowing through roots.
 *
 * Usage:
 *   <SkeletonLoader count={3} variant="card" />
 *   <SkeletonLoader variant="text" lines={4} />
 */
const SkeletonLoader = ({ count = 3, variant = 'card', lines = 4 }) => {
  const base = 'rounded-xl bg-gradient-to-r from-[#F5F5DC] via-[#E8DCC4] to-[#F5F5DC] border border-[#C5A059]/30 animate-root-pulse';

  const itemStyles = {
    card: `h-48 sm:h-56 ${base}`,
    text: `h-4 sm:h-5 ${base} mb-3`,
    button: `h-10 sm:h-12 w-48 sm:w-64 ${base}`,
    avatar: `w-12 h-12 sm:w-16 sm:h-16 ${base} rounded-full`,
  };

  return (
    <div
      className={variant === 'card' ? 'space-y-6' : 'space-y-4'}
      role="status"
      aria-label="Loading Rootle content..."
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={itemStyles[variant]}>
          {variant === 'text' && (
            <>
              {Array.from({ length: lines }).map((_, j) => (
                <div
                  key={j}
                  className={`h-4 sm:h-5 ${base} w-full ${j === lines - 1 ? 'w-2/3' : 'w-full'} mb-1.5`}
                />
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;

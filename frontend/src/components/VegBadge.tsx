import React from 'react';

export function isItemVeg(name: string, description?: string, explicitIsVeg?: boolean): boolean {
  if (typeof explicitIsVeg === 'boolean') {
    return explicitIsVeg;
  }
  const text = `${name} ${description || ''}`.toLowerCase();
  const nonVegKeywords = [
    'chicken', 'egg', 'mutton', 'fish', 'meat', 'prawn', 'keema',
    'bacon', 'pepperoni', 'pork', 'beef', 'hot dog', 'wings', 'seekh', 'shrimp'
  ];
  return !nonVegKeywords.some(keyword => text.includes(keyword));
}

interface VegBadgeProps {
  isVeg: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VegBadge: React.FC<VegBadgeProps> = ({
  isVeg,
  size = 'sm',
  showLabel = false,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {isVeg ? (
        <div
          className={`${sizeClasses[size]} border-[1.5px] border-emerald-600 rounded-[3px] bg-white dark:bg-neutral-900 flex items-center justify-center shrink-0 shadow-xs`}
          title="Vegetarian"
        >
          <div className={`${dotSizeClasses[size]} rounded-full bg-emerald-600`} />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} border-[1.5px] border-rose-600 rounded-[3px] bg-white dark:bg-neutral-900 flex items-center justify-center shrink-0 shadow-xs`}
          title="Non-Vegetarian"
        >
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-rose-600" />
        </div>
      )}
      {showLabel && (
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isVeg ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          {isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      )}
    </div>
  );
};

export default VegBadge;

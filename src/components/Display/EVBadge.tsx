import { evToBackgroundColor, evToTextColor } from '@/utils/scoring';

export interface EVBadgeProps {
  value: number;
  totalPairings?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 min-w-[36px] px-1.5 text-xs',
  md: 'h-8 min-w-[48px] px-2 text-sm',
  lg: 'h-10 min-w-[56px] px-2.5 text-lg',
};

export function EVBadge({ value, totalPairings = 5, size = 'md', className = '' }: EVBadgeProps) {
  const bgColor = evToBackgroundColor(value, totalPairings);
  const textColor = evToTextColor(value, totalPairings);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg font-bold ${sizeClasses[size]} ${bgColor} ${textColor} ${className}`}
      title="Total expected value across all pairings"
    >
      EV {value.toFixed(1)}
    </div>
  );
}

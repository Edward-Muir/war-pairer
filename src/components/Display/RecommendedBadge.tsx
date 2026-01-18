import { Check } from 'lucide-react';

export interface RecommendedBadgeProps {
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function RecommendedBadge({
  label = 'Recommended',
  showIcon = true,
  className = '',
}: RecommendedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white ${className}`}
    >
      {showIcon && <Check className="h-3 w-3" />}
      {label}
    </span>
  );
}

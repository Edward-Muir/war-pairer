import {
  scoreToBackgroundColor,
  scoreToTextColor,
  formatScoreWithDelta,
  formatScore,
} from '@/utils/scoring';

export interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showDelta?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 min-w-[24px] px-1.5 text-xs',
  md: 'h-8 min-w-[32px] px-2 text-sm',
  lg: 'h-10 min-w-[40px] px-2.5 text-lg',
};

export function ScoreBadge({
  score,
  size = 'md',
  showDelta = false,
  className = '',
}: ScoreBadgeProps) {
  const displayText = showDelta ? formatScoreWithDelta(score) : formatScore(score);
  const bgColor = scoreToBackgroundColor(score);
  const textColor = scoreToTextColor(score);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg font-bold ${sizeClasses[size]} ${bgColor} ${textColor} ${className}`}
    >
      {displayText}
    </div>
  );
}

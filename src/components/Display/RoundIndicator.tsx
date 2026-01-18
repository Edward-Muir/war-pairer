export interface RoundIndicatorProps {
  currentRound: number;
  totalRounds: number;
  showProgress?: boolean;
  className?: string;
}

export function RoundIndicator({
  currentRound,
  totalRounds,
  showProgress = false,
  className = '',
}: RoundIndicatorProps) {
  const progressPercent = (currentRound / totalRounds) * 100;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-semibold text-gray-700">
        Round {currentRound} of {totalRounds}
      </span>
      {showProgress && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

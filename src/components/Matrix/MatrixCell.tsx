import { ScoreInput } from '@/components/Inputs/ScoreInput';

export interface MatrixCellProps {
  score: number;
  onChange: (value: number) => void;
  ourPlayerName: string;
  oppPlayerName: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Individual cell in the matchup matrix.
 * Wraps ScoreInput with context-aware accessibility labels.
 */
export function MatrixCell({
  score,
  onChange,
  ourPlayerName,
  oppPlayerName,
  disabled = false,
  size = 'sm',
  className = '',
}: MatrixCellProps) {
  return (
    <div className={className}>
      <ScoreInput
        value={score}
        onChange={onChange}
        size={size}
        showColorCoding={true}
        enableModal={true}
        disabled={disabled}
        aria-label={`Score for ${ourPlayerName} vs ${oppPlayerName}`}
      />
    </div>
  );
}

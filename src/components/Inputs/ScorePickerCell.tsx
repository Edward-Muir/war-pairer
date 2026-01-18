import { useRef } from 'react';
import { motion } from 'framer-motion';
import { scoreToBackgroundColor, scoreToTextColor } from '@/utils/scoring';
import { useHaptic } from '@/hooks/useHaptic';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ScorePickerCellProps {
  value: number;
  onTap: (rect: DOMRect) => void;
  disabled?: boolean;
  showColorCoding?: boolean;
  'aria-label'?: string;
  className?: string;
}

/**
 * Compact 44x44px cell that displays a score value with color coding.
 * On tap, reports its position so a popover can be positioned near it.
 */
export function ScorePickerCell({
  value,
  onTap,
  disabled = false,
  showColorCoding = true,
  'aria-label': ariaLabel,
  className = '',
}: ScorePickerCellProps) {
  const cellRef = useRef<HTMLButtonElement>(null);
  const { haptics } = useHaptic();
  const reducedMotion = useReducedMotion();

  const handleTap = () => {
    if (disabled) return;
    haptics.light();
    if (cellRef.current) {
      onTap(cellRef.current.getBoundingClientRect());
    }
  };

  const bgColor = showColorCoding ? scoreToBackgroundColor(value) : 'bg-gray-100';
  const textColor = showColorCoding ? scoreToTextColor(value) : 'text-gray-900';

  return (
    <motion.button
      ref={cellRef}
      type="button"
      onClick={handleTap}
      disabled={disabled}
      aria-label={ariaLabel || `Score: ${value}`}
      aria-valuenow={value}
      whileTap={reducedMotion ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        w-11 h-11 min-w-[44px] min-h-[44px]
        flex items-center justify-center
        rounded-lg font-semibold text-base
        ${bgColor} ${textColor}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-blue-400'}
        transition-shadow
        ${className}
      `}
    >
      {value}
    </motion.button>
  );
}

import { Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { scoreToBackgroundColor, scoreToTextColor } from '@/utils/scoring';
import { useHaptic } from '@/hooks/useHaptic';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  showColorCoding?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const sizeStyles = {
  sm: {
    button: 'w-8 h-8 text-lg',
    display: 'w-10 h-8 text-base',
    icon: 'w-4 h-4',
  },
  md: {
    button: 'w-11 h-11 min-h-[44px] text-xl',
    display: 'w-14 h-11 min-h-[44px] text-lg',
    icon: 'w-5 h-5',
  },
  lg: {
    button: 'w-14 h-14 text-2xl',
    display: 'w-20 h-14 text-2xl font-bold',
    icon: 'w-6 h-6',
  },
};

export function ScoreInput({
  value,
  onChange,
  min = 0,
  max = 20,
  showColorCoding = false,
  size = 'md',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: ScoreInputProps) {
  const { haptics } = useHaptic();
  const reducedMotion = useReducedMotion();
  const styles = sizeStyles[size];

  const handleIncrement = () => {
    if (value < max) {
      haptics.light();
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      haptics.light();
      onChange(value - 1);
    }
  };

  const bgColor = showColorCoding ? scoreToBackgroundColor(value) : 'bg-gray-100';
  const textColor = showColorCoding ? scoreToTextColor(value) : 'text-gray-900';

  return (
    <>
      <div
        className={`inline-flex items-center gap-1 ${className}`}
        role="group"
        aria-label={ariaLabel}
      >
        <motion.button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label="Decrease score"
          whileTap={reducedMotion ? undefined : { scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            ${styles.button}
            flex items-center justify-center
            bg-gray-200 rounded-lg
            text-gray-700
            hover:bg-gray-300 active:bg-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
        >
          <Minus className={styles.icon} />
        </motion.button>

        <div
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          className={`
            ${styles.display}
            ${bgColor} ${textColor}
            flex items-center justify-center
            rounded-lg font-medium
          `}
        >
          {value}
        </div>

        <motion.button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label="Increase score"
          whileTap={reducedMotion ? undefined : { scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            ${styles.button}
            flex items-center justify-center
            bg-gray-200 rounded-lg
            text-gray-700
            hover:bg-gray-300 active:bg-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
        >
          <Plus className={styles.icon} />
        </motion.button>
      </div>
    </>
  );
}


import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { scoreToBackgroundColor, scoreToTextColor } from '@/utils/scoring';
import { useHaptic } from '@/hooks/useHaptic';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ScorePickerPopoverProps {
  isOpen: boolean;
  value: number;
  targetRect: DOMRect | null;
  onSelect: (value: number) => void;
  onClose: () => void;
}

// 3 columns x 7 rows grid for values 0-20
const SCORE_VALUES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
  [12, 13, 14],
  [15, 16, 17],
  [18, 19, 20],
];

const POPOVER_WIDTH = 148; // 3 * 44px + 2 * 8px gaps
const POPOVER_HEIGHT = 340; // 7 * 44px + 6 * 4px gaps + padding
const PADDING = 16;

function calculatePosition(targetRect: DOMRect | null) {
  if (!targetRect) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Prefer positioning below the cell
  let top = targetRect.bottom + 8;
  let left = targetRect.left + targetRect.width / 2 - POPOVER_WIDTH / 2;

  // Clamp horizontal position
  left = Math.max(PADDING, Math.min(left, viewportWidth - POPOVER_WIDTH - PADDING));

  // If not enough space below, position above
  if (top + POPOVER_HEIGHT > viewportHeight - PADDING) {
    top = targetRect.top - POPOVER_HEIGHT - 8;
  }

  // If still doesn't fit above, center vertically
  if (top < PADDING) {
    top = Math.max(PADDING, (viewportHeight - POPOVER_HEIGHT) / 2);
  }

  return { top: `${top}px`, left: `${left}px`, transform: 'none' };
}

/**
 * Portal-based popover showing a 3x7 grid of score values (0-20).
 * Positioned near the target cell with viewport bounds checking.
 */
export function ScorePickerPopover({
  isOpen,
  value,
  targetRect,
  onSelect,
  onClose,
}: ScorePickerPopoverProps) {
  const { haptics } = useHaptic();
  const reducedMotion = useReducedMotion();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => calculatePosition(targetRect));

  // Update position when targetRect changes
  useEffect(() => {
    setPosition(calculatePosition(targetRect));
  }, [targetRect]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelect = (selectedValue: number) => {
    haptics.select();
    onSelect(selectedValue);
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.15 }}
            onClick={handleBackdropClick}
          />

          {/* Popover */}
          <motion.div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            aria-label="Select score"
            className="fixed z-[101] bg-white rounded-xl shadow-xl p-2"
            style={position}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
              duration: reducedMotion ? 0 : undefined,
            }}
          >
            <div className="grid grid-cols-3 gap-1">
              {SCORE_VALUES.flat().map((scoreValue) => {
                const bgColor = scoreToBackgroundColor(scoreValue);
                const textColor = scoreToTextColor(scoreValue);
                const isSelected = scoreValue === value;

                return (
                  <motion.button
                    key={scoreValue}
                    type="button"
                    onClick={() => handleSelect(scoreValue)}
                    whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`
                      w-11 h-11 min-w-[44px] min-h-[44px]
                      flex items-center justify-center
                      rounded-lg font-semibold text-base
                      ${bgColor} ${textColor}
                      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                      transition-shadow
                    `}
                    aria-label={`Select score ${scoreValue}`}
                    aria-pressed={isSelected}
                  >
                    {scoreValue}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

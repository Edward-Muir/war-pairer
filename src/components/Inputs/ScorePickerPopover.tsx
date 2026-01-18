import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { scoreToBackgroundColor, scoreToTextColor } from '@/utils/scoring';
import { useHaptic } from '@/hooks/useHaptic';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ScorePickerPopoverProps {
  isOpen: boolean;
  value: number;
  onSelect: (value: number) => void;
  onClose: () => void;
  /** Our player's faction for the matchup reminder */
  ourFaction?: string;
  /** Opponent's faction for the matchup reminder */
  oppFaction?: string;
}

// 4 columns x 5 rows + 1 for better mobile layout (values 0-20)
const SCORE_VALUES = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [16, 17, 18, 19],
  [20], // Single cell on last row
];

/**
 * Portal-based popover showing a 4x5+1 grid of score values (0-20).
 * Always centered on screen with optional matchup reminder header.
 */
export function ScorePickerPopover({
  isOpen,
  value,
  onSelect,
  onClose,
  ourFaction,
  oppFaction,
}: ScorePickerPopoverProps) {
  const { haptics } = useHaptic();
  const reducedMotion = useReducedMotion();
  const popoverRef = useRef<HTMLDivElement>(null);

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
            className="fixed inset-0 z-[100] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.1 }}
            onClick={handleBackdropClick}
          />

          {/* Popover - centered on screen */}
          <motion.div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            aria-label="Select score"
            className="fixed z-[101] bg-white rounded-3xl shadow-2xl p-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 700,
              damping: 35,
              duration: reducedMotion ? 0 : undefined,
            }}
          >
            {/* Matchup reminder header */}
            {ourFaction && oppFaction && (
              <div className="text-center mb-4 pb-3 border-b border-gray-100">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Expected Score
                </div>
                <div className="text-base text-gray-700">
                  <span className="font-semibold">{ourFaction}</span>
                  <span className="mx-2 text-gray-400">vs</span>
                  <span className="font-semibold">{oppFaction}</span>
                </div>
              </div>
            )}

            {/* Score grid - larger buttons */}
            <div className="grid grid-cols-4 gap-3">
              {SCORE_VALUES.flat().map((scoreValue) => {
                const bgColor = scoreToBackgroundColor(scoreValue);
                const textColor = scoreToTextColor(scoreValue);
                const isSelected = scoreValue === value;

                return (
                  <motion.button
                    key={scoreValue}
                    type="button"
                    onClick={() => handleSelect(scoreValue)}
                    whileTap={reducedMotion ? undefined : { scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`
                      w-[72px] h-[72px] min-w-[72px] min-h-[72px]
                      flex items-center justify-center
                      rounded-2xl font-bold text-2xl
                      ${bgColor} ${textColor}
                      ${isSelected ? 'ring-3 ring-blue-500 ring-offset-2' : ''}
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

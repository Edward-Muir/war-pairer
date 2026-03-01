import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Pairing } from '@/store/types';
import { calculateTotalScore } from '@/utils/scoring';
import { MatchupPreview } from '@/components/Display/MatchupPreview';
import { ScoreBadge } from '@/components/Display/ScoreBadge';

export interface LockedPairingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pairings: Pairing[];
  showTotalScore?: boolean;
}

export function LockedPairingsDrawer({
  isOpen,
  onClose,
  pairings,
  showTotalScore = true,
}: LockedPairingsDrawerProps) {
  const totalExpected = calculateTotalScore(pairings.map((p) => p.expectedScore));

  const title = pairings.length > 0 ? `Locked Pairings (${pairings.length})` : 'Locked Pairings';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pairings-backdrop"
            className="fixed inset-0 bg-black/25 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="pairings-drawer"
            className="fixed top-0 right-0 bottom-0 w-72 bg-white border-l border-gray-200 shadow-sm z-[56] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) onClose();
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="font-semibold text-lg text-gray-900">{title}</span>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close pairings"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {pairings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-gray-500">No pairings locked yet</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Complete pairing rounds to see locked matchups here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pairings.map((pairing, index) => (
                    <MatchupPreview
                      key={`${pairing.ourPlayer.id}-${pairing.oppPlayer.id}-${index}`}
                      ourPlayer={pairing.ourPlayer}
                      oppPlayer={pairing.oppPlayer}
                      expectedScore={pairing.expectedScore}
                      actualScore={pairing.actualScore}
                      round={pairing.round}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Total score */}
            {showTotalScore && pairings.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Total Expected Score</span>
                <ScoreBadge score={totalExpected} size="lg" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

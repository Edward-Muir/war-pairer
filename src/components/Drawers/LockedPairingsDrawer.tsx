import type { Pairing } from '@/store/types';
import { calculateTotalScore } from '@/utils/scoring';
import { BottomSheet } from '@/components/Common/BottomSheet';
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

  const title = pairings.length > 0
    ? `Locked Pairings (${pairings.length})`
    : 'Locked Pairings';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
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

          {showTotalScore && pairings.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">
                Total Expected Score
              </span>
              <ScoreBadge score={totalExpected} size="lg" />
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

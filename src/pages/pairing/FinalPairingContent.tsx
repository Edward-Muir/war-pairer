import { Button } from '@/components/Common/Button';
import { MatchupPreview } from '@/components/Display/MatchupPreview';
import { EVBadge } from '@/components/Display/EVBadge';
import { usePairingStore } from '@/store/pairingStore';
import { getSelectionRoundCount } from '@/store/types';

interface FinalPairingContentProps {
  onComplete: () => void;
}

export function FinalPairingContent({ onComplete }: FinalPairingContentProps) {
  const { matrix, ourRemaining, oppRemaining, pairings, teamSize, choosePairing } =
    usePairingStore();

  // 5v5: 1 player remaining per side (forced 1v1)
  const is5v5Final = ourRemaining.length === 1 && oppRemaining.length === 1;
  // 8v8: 0 players remaining (all locked by DefenderChooseContent auto-pairing)
  const is8v8Final = ourRemaining.length === 0 && oppRemaining.length === 0;

  const ourFinalPlayer = ourRemaining[0];
  const oppFinalPlayer = oppRemaining[0];

  if (!matrix || (!is5v5Final && !is8v8Final)) {
    return (
      <div className="p-4 text-red-600">
        Error: Missing data for final pairing. Please go back and try again.
      </div>
    );
  }

  const finalScore = is5v5Final
    ? (matrix.scores[ourFinalPlayer.index]?.[oppFinalPlayer.index] ?? 10)
    : 0;

  const currentTotal = pairings.reduce((sum, p) => sum + p.expectedScore, 0);
  const projectedTotal = currentTotal + finalScore;

  const handleComplete = () => {
    if (is5v5Final) {
      const finalRound = getSelectionRoundCount(teamSize) + 1;
      choosePairing(ourFinalPlayer, oppFinalPlayer, finalRound);
    }
    // For 8v8, all pairings already locked — nothing to do
    onComplete();
  };

  return (
    <div className="p-4 space-y-6">
      {/* 5v5: Show forced final pairing */}
      {is5v5Final && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Final Pairing (Forced)</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-4">
              With all other players paired, these final two players must face each other:
            </p>
            <MatchupPreview
              ourPlayer={ourFinalPlayer}
              oppPlayer={oppFinalPlayer}
              expectedScore={finalScore}
              round={getSelectionRoundCount(teamSize) + 1}
            />
          </div>
        </div>
      )}

      {/* 8v8: All pairings already locked */}
      {is8v8Final && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">All Pairings Locked</h3>
          <p className="text-sm text-gray-600 mb-4">
            All {teamSize} pairings have been determined.
          </p>
        </div>
      )}

      {/* All Pairings Summary */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          All Pairings ({is5v5Final ? pairings.length + 1 : pairings.length} total)
        </h3>
        <div className="space-y-2">
          {pairings.map((pairing, idx) => (
            <MatchupPreview
              key={idx}
              ourPlayer={pairing.ourPlayer}
              oppPlayer={pairing.oppPlayer}
              expectedScore={pairing.expectedScore}
              round={pairing.round}
              compact
            />
          ))}
          {/* 5v5: show the not-yet-locked final pairing */}
          {is5v5Final && (
            <MatchupPreview
              ourPlayer={ourFinalPlayer}
              oppPlayer={oppFinalPlayer}
              expectedScore={finalScore}
              round={getSelectionRoundCount(teamSize) + 1}
              compact
              className="ring-2 ring-amber-400"
            />
          )}
        </div>
      </div>

      {/* Score Summary */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Score Summary</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Current locked pairings:</span>
            <span className="font-semibold">{currentTotal} pts</span>
          </div>
          {is5v5Final && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Final pairing:</span>
              <span className="font-semibold">+{finalScore} pts</span>
            </div>
          )}
          <hr className="my-2 border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">Projected Total:</span>
            <EVBadge value={projectedTotal} totalPairings={teamSize} size="lg" />
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            (Neutral = {teamSize * 10} points)
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
        <Button variant="primary" fullWidth onClick={handleComplete}>
          Complete Pairing
        </Button>
      </div>
    </div>
  );
}

import { Button } from '@/components/Common/Button';
import { MatchupPreview } from '@/components/Display/MatchupPreview';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { usePairingStore } from '@/store/pairingStore';

interface FinalPairingContentProps {
  onComplete: () => void;
}

export function FinalPairingContent({ onComplete }: FinalPairingContentProps) {
  const { matrix, ourRemaining, oppRemaining, pairings, choosePairing } =
    usePairingStore();

  // Should have exactly 1 player remaining on each side
  const ourFinalPlayer = ourRemaining[0];
  const oppFinalPlayer = oppRemaining[0];

  if (!matrix || !ourFinalPlayer || !oppFinalPlayer) {
    return (
      <div className="p-4 text-red-600">
        Error: Missing data for final pairing. Please go back and try again.
      </div>
    );
  }

  // Get the expected score for the final matchup
  const finalScore =
    matrix.scores[ourFinalPlayer.index]?.[oppFinalPlayer.index] ?? 10;

  // Calculate total expected score including the final pairing
  const currentTotal = pairings.reduce((sum, p) => sum + p.expectedScore, 0);
  const projectedTotal = currentTotal + finalScore;

  const handleComplete = () => {
    // Lock the final pairing
    choosePairing(ourFinalPlayer, oppFinalPlayer, 3);
    onComplete();
  };

  return (
    <div className="p-4 space-y-6">
      {/* Final Pairing */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Final Pairing (Forced)
        </h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            With all other players paired, these final two players must face
            each other:
          </p>
          <MatchupPreview
            ourPlayer={ourFinalPlayer}
            oppPlayer={oppFinalPlayer}
            expectedScore={finalScore}
            round={3}
          />
        </div>
      </div>

      {/* All Pairings Summary */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          All Pairings ({pairings.length + 1} total)
        </h3>
        <div className="space-y-2">
          {/* Existing pairings */}
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
          {/* Final pairing (not yet locked) */}
          <MatchupPreview
            ourPlayer={ourFinalPlayer}
            oppPlayer={oppFinalPlayer}
            expectedScore={finalScore}
            round={3}
            compact
            className="ring-2 ring-amber-400"
          />
        </div>
      </div>

      {/* Score Summary */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Score Summary
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Current locked pairings:</span>
            <span className="font-semibold">{currentTotal} pts</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Final pairing:</span>
            <span className="font-semibold">+{finalScore} pts</span>
          </div>
          <hr className="my-2 border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">
              Projected Total:
            </span>
            <ScoreBadge
              score={projectedTotal}
              size="lg"
            />
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            (Neutral = 50 points)
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

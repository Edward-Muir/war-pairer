import { useState, useMemo } from 'react';
import { Button } from '@/components/Common/Button';
import { DefenderCard } from '@/components/Cards/DefenderCard';
import { usePairingStore } from '@/store/pairingStore';
import { analyzeDefenderPhase } from '@/algorithms/fullGameTheory';
import type { Phase, Player } from '@/store/types';

interface DefenderSelectContentProps {
  round: 1 | 2;
  onNext: (phase: Phase) => void;
}

export function DefenderSelectContent({
  round,
  onNext,
}: DefenderSelectContentProps) {
  const {
    matrix,
    ourRemaining,
    oppRemaining,
    setOurDefender1,
    setOurDefender2,
  } = usePairingStore();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Memoize analysis to prevent recalculation on every render
  const { defenderOptions, gameValue } = useMemo(() => {
    if (!matrix) {
      return { defenderOptions: [], gameValue: 0 };
    }

    // Get indices for algorithm
    const ourIndices = ourRemaining.map((p) => p.index);
    const oppIndices = oppRemaining.map((p) => p.index);

    // Analyze defender options with full game tree evaluation
    const result = analyzeDefenderPhase(matrix.scores, ourIndices, oppIndices);

    // Map analysis back to Player objects
    const options = result.defenderAnalyses.map((analysis, idx) => {
      const player = ourRemaining.find((p) => p.index === analysis.playerIndex)!;
      return {
        player,
        analysis,
        rank: idx + 1,
      };
    });

    return { defenderOptions: options, gameValue: result.gameValue };
  }, [matrix, ourRemaining, oppRemaining]);

  if (!matrix) {
    return <div className="p-4 text-red-600">No matrix data available</div>;
  }

  const handleConfirm = () => {
    if (!selectedPlayer) return;

    if (round === 1) {
      setOurDefender1(selectedPlayer);
      onNext('defender-1-reveal');
    } else {
      setOurDefender2(selectedPlayer);
      onNext('defender-2-reveal');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-gray-600">
        Select your defender for Round {round}. Players are ranked by their
        <strong> game value</strong> - the total expected score considering all
        future rounds with optimal play.
        <span className="block mt-1 text-xs text-gray-500">
          Game value with optimal play: {gameValue.toFixed(1)} points
        </span>
      </div>

      {defenderOptions.map(({ player, analysis, rank }) => (
        <DefenderCard
          key={player.id}
          player={player}
          analysis={analysis}
          opponentPlayers={matrix.oppTeam}
          rank={rank}
          selected={selectedPlayer?.id === player.id}
          onClick={() => setSelectedPlayer(player)}
        />
      ))}

      <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
        <Button
          variant="primary"
          fullWidth
          disabled={!selectedPlayer}
          onClick={handleConfirm}
        >
          Confirm Defender
        </Button>
      </div>
    </div>
  );
}

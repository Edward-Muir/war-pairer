import { useState } from 'react';
import { Button } from '@/components/Common/Button';
import { DefenderCard } from '@/components/Cards/DefenderCard';
import { usePairingStore } from '@/store/pairingStore';
import { analyzeDefenderOptions } from '@/algorithms/defenderScore';
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

  if (!matrix) {
    return <div className="p-4 text-red-600">No matrix data available</div>;
  }

  // Get indices for algorithm
  const ourIndices = ourRemaining.map((p) => p.index);
  const oppIndices = oppRemaining.map((p) => p.index);

  // Analyze defender options
  const analyses = analyzeDefenderOptions(matrix.scores, ourIndices, oppIndices);

  // Map analysis back to Player objects
  const defenderOptions = analyses.map((analysis, idx) => {
    const player = ourRemaining.find((p) => p.index === analysis.playerIndex)!;
    return {
      player,
      analysis,
      rank: idx + 1,
    };
  });

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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Select your defender for Round {round}. Players are ranked by their
          defender score - higher is better (guarantees better outcome against
          opponent's optimal attackers).
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
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
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

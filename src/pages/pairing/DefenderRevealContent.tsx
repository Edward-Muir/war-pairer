import { useState, useMemo } from 'react';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { PlayerPicker } from '@/components/Inputs/PlayerPicker';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { getBestAttackerPair } from '@/algorithms/attackerAnalysis';
import { usePairingStore } from '@/store/pairingStore';
import type { Phase, Player } from '@/store/types';

interface DefenderRevealContentProps {
  round: 1 | 2;
  onNext: (phase: Phase) => void;
}

export function DefenderRevealContent({
  round,
  onNext,
}: DefenderRevealContentProps) {
  const { round1, round2, oppRemaining, ourRemaining, matrix, setOppDefender1, setOppDefender2 } =
    usePairingStore();

  const ourDefender = round === 1 ? round1.ourDefender : round2.ourDefender;

  // Get available attackers (our remaining players minus our defender)
  const availableAttackers = ourRemaining.filter(p => p.id !== ourDefender?.id);
  const [selectedOppDefender, setSelectedOppDefender] = useState<Player | null>(
    null
  );

  // Calculate best attacker pair when opponent defender is selected
  const bestPairAnalysis = useMemo(() => {
    if (!selectedOppDefender || !matrix) return null;
    const availableAttackerIndices = availableAttackers.map(p => p.index);
    return getBestAttackerPair(matrix.scores, selectedOppDefender.index, availableAttackerIndices);
  }, [selectedOppDefender, matrix, availableAttackers]);

  // Get player names for the best pair
  const bestPairPlayers = useMemo(() => {
    if (!bestPairAnalysis) return null;
    const [idx1, idx2] = bestPairAnalysis.attackers;
    const p1 = availableAttackers.find(p => p.index === idx1);
    const p2 = availableAttackers.find(p => p.index === idx2);
    const forced = availableAttackers.find(p => p.index === bestPairAnalysis.forcedMatchup);
    return p1 && p2 ? { p1, p2, forced } : null;
  }, [bestPairAnalysis, availableAttackers]);

  if (!ourDefender) {
    return (
      <div className="p-4 text-red-600">
        Error: Our defender not selected. Please go back.
      </div>
    );
  }

  const handleConfirm = () => {
    if (!selectedOppDefender) return;

    if (round === 1) {
      setOppDefender1(selectedOppDefender);
      onNext('attacker-1-select');
    } else {
      setOppDefender2(selectedOppDefender);
      onNext('attacker-2-select');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Our Defender */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Our Defender
          </h3>
          <PlayerCard player={ourDefender} />
        </div>

        {/* Opponent's Defender Reveal */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Opponent's Defender
          </h3>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Enter the defender your opponent has selected:
            </p>
            <PlayerPicker
              players={oppRemaining}
              value={selectedOppDefender}
              onChange={setSelectedOppDefender}
              placeholder="Select opponent's defender..."
              label="Opponent's Defender"
              useModal
            />
          </Card>
        </div>

        {/* Comparison (once both selected) */}
        {selectedOppDefender && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Defender Comparison
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-center text-gray-500 mb-1">US</div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="font-semibold text-gray-900">
                    {ourDefender.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {ourDefender.faction}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-center text-gray-500 mb-1">
                  THEM
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="font-semibold text-gray-900">
                    {selectedOppDefender.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedOppDefender.faction}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Best Attacker Pair Preview */}
        {selectedOppDefender && bestPairAnalysis && bestPairPlayers && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Our Best Attacker Pair
            </h3>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  vs {selectedOppDefender.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Expected:</span>
                  <ScoreBadge score={bestPairAnalysis.expectedScore} showDelta />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-2 text-center text-sm ${bestPairPlayers.forced?.id === bestPairPlayers.p1.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                  <div className="font-medium">{bestPairPlayers.p1.name}</div>
                  <div className="text-xs text-gray-500">{bestPairPlayers.p1.faction}</div>
                  {bestPairPlayers.forced?.id === bestPairPlayers.p1.id && (
                    <div className="text-xs text-blue-600 mt-1">Will play</div>
                  )}
                </div>
                <div className={`rounded-lg p-2 text-center text-sm ${bestPairPlayers.forced?.id === bestPairPlayers.p2.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                  <div className="font-medium">{bestPairPlayers.p2.name}</div>
                  <div className="text-xs text-gray-500">{bestPairPlayers.p2.faction}</div>
                  {bestPairPlayers.forced?.id === bestPairPlayers.p2.id && (
                    <div className="text-xs text-blue-600 mt-1">Will play</div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <Button
          variant="primary"
          fullWidth
          disabled={!selectedOppDefender}
          onClick={handleConfirm}
        >
          Continue to Attacker Selection
        </Button>
      </div>
    </div>
  );
}

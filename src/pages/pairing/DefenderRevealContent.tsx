import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { getBestAttackerPair } from '@/algorithms/attackerAnalysis';
import { usePairingStore } from '@/store/pairingStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHaptic } from '@/hooks/useHaptic';
import type { Phase, Player } from '@/store/types';

interface DefenderRevealContentProps {
  round: 1 | 2;
  onNext: (phase: Phase) => void;
}

const listContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};
const listItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
const noMotionItem = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
};

export function DefenderRevealContent({
  round,
  onNext,
}: DefenderRevealContentProps) {
  const reducedMotion = useReducedMotion();
  const { haptics } = useHaptic();
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

  const handleSelectOppDefender = (player: Player) => {
    haptics.select();
    setSelectedOppDefender(player);
  };

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

  const itemVariants = reducedMotion ? noMotionItem : listItem;

  return (
    <div className="p-4 space-y-6">
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
        <p className="text-sm text-gray-600 mb-3">
          Select the defender your opponent has chosen:
        </p>
        <motion.div
          className="space-y-2"
          variants={reducedMotion ? undefined : listContainer}
          initial="initial"
          animate="animate"
        >
          {oppRemaining.map((player) => (
            <motion.div key={player.id} variants={itemVariants}>
              <PlayerCard
                player={player}
                isOpponent
                selected={selectedOppDefender?.id === player.id}
                onClick={() => handleSelectOppDefender(player)}
              />
            </motion.div>
          ))}
        </motion.div>
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
                vs {selectedOppDefender.faction}
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

      <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
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

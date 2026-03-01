import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Common/Button';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { AttackerPairCard } from '@/components/Cards/AttackerPairCard';
import { usePairingStore } from '@/store/pairingStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHaptic } from '@/hooks/useHaptic';
import { useLockedTotal } from '@/hooks/useLockedTotal';
import { analyzeAttackerPhase } from '@/algorithms/fullGameTheory';
import type { Phase } from '@/store/types';
import type { FullAttackerAnalysis } from '@/algorithms/fullGameTheory';

interface AttackerSelectContentProps {
  round: number;
  onNext: (phase: Phase) => void;
}

export function AttackerSelectContent({ round, onNext }: AttackerSelectContentProps) {
  const reducedMotion = useReducedMotion();
  const { haptics } = useHaptic();
  const lockedTotal = useLockedTotal();
  const { matrix, ourRemaining, teamSize, getRound, setOurAttackers } = usePairingStore();

  const [selectedPair, setSelectedPair] = useState<FullAttackerAnalysis | null>(null);

  const handleSelectPair = (analysis: FullAttackerAnalysis) => {
    haptics.select();
    setSelectedPair(analysis);
  };

  const roundState = getRound(round);
  const ourDefender = roundState.ourDefender;
  const oppDefender = roundState.oppDefender;

  // Get available attackers (our remaining players minus our defender)
  const availableAttackers = ourRemaining.filter((p) => p.id !== ourDefender?.id);

  // For round 2, only 2 players remain, so there's only 1 possible pair (auto-select)
  const isForced = availableAttackers.length === 2;

  // Analyze attacker pair options with full game tree evaluation
  const analyses = useMemo(() => {
    if (!matrix || !oppDefender || !ourDefender) return [];

    // Get opponent players remaining (excluding their defender)
    const oppAvailable = usePairingStore
      .getState()
      .oppRemaining.filter((p) => p.id !== oppDefender.id)
      .map((p) => p.index);

    return analyzeAttackerPhase(
      matrix.scores,
      ourDefender.index,
      oppDefender.index,
      availableAttackers.map((p) => p.index),
      oppAvailable
    );
  }, [matrix, ourDefender, oppDefender, availableAttackers]);

  // Auto-select for forced pair
  useEffect(() => {
    if (isForced && analyses.length === 1 && !selectedPair) {
      setSelectedPair(analyses[0]);
    }
  }, [isForced, analyses, selectedPair]);

  if (!matrix || !oppDefender) {
    return (
      <div className="p-4 text-red-600">Error: Missing data. Please go back and try again.</div>
    );
  }

  const handleConfirm = () => {
    if (!selectedPair) return;

    // Convert indices to Player objects
    const attacker1 = ourRemaining.find((p) => p.index === selectedPair.attackers[0]);
    const attacker2 = ourRemaining.find((p) => p.index === selectedPair.attackers[1]);

    if (!attacker1 || !attacker2) return;

    setOurAttackers(round, [attacker1, attacker2]);
    onNext(`attacker-${round}-reveal` as Phase);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Target Defender */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Target: Opponent's Defender</h3>
        <PlayerCard player={oppDefender} isOpponent />
      </div>

      {/* Attacker Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          {isForced
            ? 'Your Attackers (Forced)'
            : `Select 2 Attackers (${analyses.length} possible pairs)`}
        </h3>

        {isForced && (
          <p className="text-sm text-gray-600 mb-4">
            With only 2 players remaining, this pair is automatically selected.
          </p>
        )}

        {!isForced && (
          <p className="text-sm text-gray-600 mb-4">
            Choose which pair of attackers to send against the opponent's defender. The opponent
            will choose which attacker faces their defender (picking the one worse for you).
          </p>
        )}

        <motion.div
          className="space-y-3"
          variants={
            reducedMotion ? undefined : { animate: { transition: { staggerChildren: 0.04 } } }
          }
          initial="initial"
          animate="animate"
        >
          {analyses.map((analysis, idx) => (
            <motion.div
              key={`${analysis.attackers[0]}-${analysis.attackers[1]}`}
              variants={
                reducedMotion
                  ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
                  : {
                      initial: { opacity: 0, y: 8 },
                      animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                    }
              }
            >
              <AttackerPairCard
                analysis={analysis}
                ourPlayers={ourRemaining}
                oppDefender={oppDefender}
                rank={idx + 1}
                lockedTotal={lockedTotal}
                totalPairings={teamSize}
                selected={
                  selectedPair?.attackers[0] === analysis.attackers[0] &&
                  selectedPair?.attackers[1] === analysis.attackers[1]
                }
                onClick={() => handleSelectPair(analysis)}
                disabled={isForced && idx > 0}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
        <Button variant="primary" fullWidth disabled={!selectedPair} onClick={handleConfirm}>
          {isForced ? 'Continue' : 'Confirm Attackers'}
        </Button>
      </div>
    </div>
  );
}

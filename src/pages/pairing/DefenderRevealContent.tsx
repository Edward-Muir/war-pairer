import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { getBestAttackerPair } from '@/algorithms/attackerAnalysis';
import { analyzeDefenderPhase } from '@/algorithms/fullGameTheory';
import { getOpponentMatrix } from '@/algorithms/equilibriumSolver';
import { usePairingStore } from '@/store/pairingStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHaptic } from '@/hooks/useHaptic';
import type { Phase, Player } from '@/store/types';

interface DefenderRevealContentProps {
  round: number;
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

function OpponentDefenderAnalysis({
  oppOptimal,
  selectedOppDefender,
  opponentComparison,
  oppRemaining,
}: {
  oppOptimal: { playerIndex: number; gameValue: number } | null;
  selectedOppDefender: Player | null;
  opponentComparison: {
    playedOptimally: boolean;
    mistakeMagnitude: number;
    optimalGameValue: number;
    actualGameValue: number;
    optimalFaction: string | undefined;
  } | null;
  oppRemaining: Player[];
}) {
  return (
    <>
      {oppOptimal && !selectedOppDefender && (
        <Card className="bg-amber-50 border-amber-200 p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">
            Opponent&apos;s Optimal Defender
          </h4>
          <div className="text-sm text-amber-700">
            Best defender for them:{' '}
            <span className="font-medium">
              {oppRemaining.find((p) => p.index === oppOptimal.playerIndex)?.faction}
            </span>
          </div>
          <div className="text-xs text-amber-600 mt-1">
            Game value (for them): {oppOptimal.gameValue.toFixed(1)}
          </div>
        </Card>
      )}

      {opponentComparison && selectedOppDefender && (
        <Card
          className={`p-4 ${
            opponentComparison.playedOptimally
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">
              {opponentComparison.playedOptimally
                ? 'Opponent Played Optimally'
                : 'Opponent Made a Mistake!'}
            </h4>
            {!opponentComparison.playedOptimally && (
              <span className="inline-flex items-center rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                +{opponentComparison.mistakeMagnitude.toFixed(1)} for us
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">Optimal for Them</div>
              <ScoreBadge score={opponentComparison.optimalGameValue} size="sm" showDelta />
              <div className="text-xs text-gray-500 mt-1">
                ({opponentComparison.optimalFaction})
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Their Selection</div>
              <ScoreBadge score={opponentComparison.actualGameValue} size="sm" showDelta />
              <div className="text-xs text-gray-500 mt-1">({selectedOppDefender.faction})</div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

function BestAttackerPairPreview({
  selectedOppDefender,
  bestPairAnalysis,
  bestPairPlayers,
}: {
  selectedOppDefender: Player | null;
  bestPairAnalysis: { expectedScore: number } | null;
  bestPairPlayers: { p1: Player; p2: Player; forced: Player | undefined } | null;
}) {
  if (!selectedOppDefender || !bestPairAnalysis || !bestPairPlayers) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">Our Best Attacker Pair</h3>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">vs {selectedOppDefender.faction}</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Expected:</span>
            <ScoreBadge score={bestPairAnalysis.expectedScore} showDelta />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-lg p-2 text-center text-sm ${bestPairPlayers.forced?.id === bestPairPlayers.p1.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
          >
            <div className="font-medium">{bestPairPlayers.p1.name}</div>
            <div className="text-xs text-gray-500">{bestPairPlayers.p1.faction}</div>
            {bestPairPlayers.forced?.id === bestPairPlayers.p1.id && (
              <div className="text-xs text-blue-600 mt-1">Will play</div>
            )}
          </div>
          <div
            className={`rounded-lg p-2 text-center text-sm ${bestPairPlayers.forced?.id === bestPairPlayers.p2.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
          >
            <div className="font-medium">{bestPairPlayers.p2.name}</div>
            <div className="text-xs text-gray-500">{bestPairPlayers.p2.faction}</div>
            {bestPairPlayers.forced?.id === bestPairPlayers.p2.id && (
              <div className="text-xs text-blue-600 mt-1">Will play</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function DefenderRevealContent({ round, onNext }: DefenderRevealContentProps) {
  const reducedMotion = useReducedMotion();
  const { haptics } = useHaptic();
  const { oppRemaining, ourRemaining, matrix, getRound, setOppDefender } = usePairingStore();

  const ourDefender = getRound(round).ourDefender;

  // Get available attackers (our remaining players minus our defender)
  const availableAttackers = ourRemaining.filter((p) => p.id !== ourDefender?.id);
  const [selectedOppDefender, setSelectedOppDefender] = useState<Player | null>(null);

  // Calculate best attacker pair when opponent defender is selected
  const bestPairAnalysis = useMemo(() => {
    if (!selectedOppDefender || !matrix) return null;
    const availableAttackerIndices = availableAttackers.map((p) => p.index);
    return getBestAttackerPair(matrix.scores, selectedOppDefender.index, availableAttackerIndices);
  }, [selectedOppDefender, matrix, availableAttackers]);

  // Get player names for the best pair
  const bestPairPlayers = useMemo(() => {
    if (!bestPairAnalysis) return null;
    const [idx1, idx2] = bestPairAnalysis.attackers;
    const p1 = availableAttackers.find((p) => p.index === idx1);
    const p2 = availableAttackers.find((p) => p.index === idx2);
    const forced = availableAttackers.find((p) => p.index === bestPairAnalysis.forcedMatchup);
    return p1 && p2 ? { p1, p2, forced } : null;
  }, [bestPairAnalysis, availableAttackers]);

  // Analyze opponent's defender options from their perspective
  const oppDefenderAnalysis = useMemo(() => {
    if (!matrix) return null;
    const oppMatrix = getOpponentMatrix(matrix.scores);
    const oppIndices = oppRemaining.map((p) => p.index);
    const ourIndices = ourRemaining.map((p) => p.index);
    return analyzeDefenderPhase(oppMatrix, oppIndices, ourIndices);
  }, [matrix, oppRemaining, ourRemaining]);

  // Get optimal defender info
  const oppOptimal = oppDefenderAnalysis?.defenderAnalyses[0] ?? null;

  // Compare actual selection to optimal
  const opponentComparison = useMemo(() => {
    if (!oppDefenderAnalysis || !selectedOppDefender || !oppOptimal) return null;

    const actualAnalysis = oppDefenderAnalysis.defenderAnalyses.find(
      (a) => a.playerIndex === selectedOppDefender.index
    );
    if (!actualAnalysis) return null;

    // Mistake magnitude from opponent's perspective (their game value loss)
    // Higher gameValue = better for opponent as defender
    const mistakeMagnitude = oppOptimal.gameValue - actualAnalysis.gameValue;

    return {
      optimalPlayerIndex: oppOptimal.playerIndex,
      optimalGameValue: oppOptimal.gameValue,
      actualGameValue: actualAnalysis.gameValue,
      mistakeMagnitude,
      playedOptimally: Math.abs(mistakeMagnitude) < 0.01,
      optimalFaction: oppRemaining.find((p) => p.index === oppOptimal.playerIndex)?.faction,
    };
  }, [oppDefenderAnalysis, oppOptimal, selectedOppDefender, oppRemaining]);

  if (!ourDefender) {
    return (
      <div className="p-4 text-red-600">Error: Our defender not selected. Please go back.</div>
    );
  }

  const handleSelectOppDefender = (player: Player) => {
    haptics.select();
    setSelectedOppDefender(player);
  };

  const handleConfirm = () => {
    if (!selectedOppDefender) return;
    setOppDefender(round, selectedOppDefender);
    onNext(`attacker-${round}-select` as Phase);
  };

  const itemVariants = reducedMotion ? noMotionItem : listItem;

  return (
    <div className="p-4 space-y-6">
      {/* Our Defender */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Our Defender</h3>
        <PlayerCard player={ourDefender} />
      </div>

      {/* Opponent's Defender Reveal */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Opponent's Defender</h3>
        <p className="text-sm text-gray-600 mb-3">Select the defender your opponent has chosen:</p>
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

      <OpponentDefenderAnalysis
        oppOptimal={oppOptimal}
        selectedOppDefender={selectedOppDefender}
        opponentComparison={opponentComparison}
        oppRemaining={oppRemaining}
      />

      {/* Comparison (once both selected) */}
      {selectedOppDefender && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Defender Comparison</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-center text-gray-500 mb-1">US</div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="font-semibold text-gray-900">{ourDefender.name}</div>
                <div className="text-sm text-gray-600">{ourDefender.faction}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-center text-gray-500 mb-1">THEM</div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="font-semibold text-gray-900">{selectedOppDefender.faction}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BestAttackerPairPreview
        selectedOppDefender={selectedOppDefender}
        bestPairAnalysis={bestPairAnalysis}
        bestPairPlayers={bestPairPlayers}
      />

      <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
        <Button variant="primary" fullWidth disabled={!selectedOppDefender} onClick={handleConfirm}>
          Continue to Attacker Selection
        </Button>
      </div>
    </div>
  );
}

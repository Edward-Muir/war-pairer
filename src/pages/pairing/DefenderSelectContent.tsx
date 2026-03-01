import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Common/Button';
import { DefenderCard } from '@/components/Cards/DefenderCard';
import { usePairingStore } from '@/store/pairingStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHaptic } from '@/hooks/useHaptic';
import { useLockedTotal } from '@/hooks/useLockedTotal';
import { analyzeDefenderPhase, initMemoCache } from '@/algorithms/fullGameTheory';
import type { DefenderPhaseResult } from '@/algorithms/fullGameTheory';
import type { Phase, Player } from '@/store/types';

interface DefenderSelectContentProps {
  round: number;
  onNext: (phase: Phase) => void;
}

export function DefenderSelectContent({ round, onNext }: DefenderSelectContentProps) {
  const reducedMotion = useReducedMotion();
  const { haptics } = useHaptic();
  const lockedTotal = useLockedTotal();
  const { matrix, ourRemaining, oppRemaining, teamSize, setOurDefender } = usePairingStore();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const needsDeferred = teamSize > 5 && round === 1;
  const [isComputing, setIsComputing] = useState(needsDeferred);
  const [deferredResult, setDeferredResult] = useState<DefenderPhaseResult | null>(null);

  const handleSelectPlayer = (player: Player) => {
    haptics.select();
    setSelectedPlayer(player);
  };

  // Deferred computation for 8v8 round 1 (may be slow on mobile)
  useEffect(() => {
    if (!needsDeferred || !matrix) return;
    setIsComputing(true);
    const timer = setTimeout(() => {
      initMemoCache();
      const ourIndices = ourRemaining.map((p) => p.index);
      const oppIndices = oppRemaining.map((p) => p.index);
      setDeferredResult(analyzeDefenderPhase(matrix.scores, ourIndices, oppIndices));
      setIsComputing(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [needsDeferred, matrix, ourRemaining, oppRemaining]);

  // Synchronous computation for all other rounds (fast enough for first paint)
  const analysisResult = useMemo(() => {
    if (needsDeferred) return deferredResult;
    if (!matrix) return null;
    const ourIndices = ourRemaining.map((p) => p.index);
    const oppIndices = oppRemaining.map((p) => p.index);
    return analyzeDefenderPhase(matrix.scores, ourIndices, oppIndices);
  }, [needsDeferred, deferredResult, matrix, ourRemaining, oppRemaining]);

  const defenderOptions = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.defenderAnalyses.map((analysis, idx) => {
      const player = ourRemaining.find((p) => p.index === analysis.playerIndex)!;
      return { player, analysis, rank: idx + 1 };
    });
  }, [analysisResult, ourRemaining]);

  const gameValue = analysisResult?.gameValue ?? 0;

  if (!matrix) {
    return <div className="p-4 text-red-600">No matrix data available</div>;
  }

  const handleConfirm = () => {
    if (!selectedPlayer) return;
    setOurDefender(round, selectedPlayer);
    onNext(`defender-${round}-reveal` as Phase);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-gray-600">
        Select your defender for Round {round}. Players are ranked by their
        <strong> game value</strong> - the total expected score considering all future rounds with
        optimal play.
        <span className="block mt-1 text-xs text-gray-500">
          EV with optimal play: {(gameValue + lockedTotal).toFixed(1)} points
        </span>
      </div>

      {isComputing && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-sm text-gray-500">Analyzing matchups...</span>
        </div>
      )}

      {!isComputing && (
        <>
          <motion.div
            className="space-y-4"
            variants={
              reducedMotion ? undefined : { animate: { transition: { staggerChildren: 0.04 } } }
            }
            initial="initial"
            animate="animate"
          >
            {defenderOptions.map(({ player, analysis, rank }) => (
              <motion.div
                key={player.id}
                variants={
                  reducedMotion
                    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
                    : {
                        initial: { opacity: 0, y: 8 },
                        animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                      }
                }
              >
                <DefenderCard
                  player={player}
                  analysis={analysis}
                  opponentPlayers={matrix.oppTeam}
                  rank={rank}
                  lockedTotal={lockedTotal}
                  totalPairings={teamSize}
                  selected={selectedPlayer?.id === player.id}
                  onClick={() => handleSelectPlayer(player)}
                />
              </motion.div>
            ))}
          </motion.div>

          <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
            <Button variant="primary" fullWidth disabled={!selectedPlayer} onClick={handleConfirm}>
              Confirm Defender
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { usePairingStore } from '@/store/pairingStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHaptic } from '@/hooks/useHaptic';
import { analyzeOpponentAttackerPhase } from '@/algorithms/fullGameTheory';
import type { Phase, Player } from '@/store/types';

function computeAttackerScores(
  oppAttacker1: Player | null,
  oppAttacker2: Player | null,
  ourDefender: Player,
  getExpectedScore: (ourIdx: number, oppIdx: number) => number
) {
  const opp1Score = oppAttacker1 ? getExpectedScore(ourDefender.index, oppAttacker1.index) : null;
  const opp2Score = oppAttacker2 ? getExpectedScore(ourDefender.index, oppAttacker2.index) : null;
  const forcedAttacker =
    opp1Score !== null && opp2Score !== null
      ? opp1Score <= opp2Score
        ? oppAttacker1
        : oppAttacker2
      : null;
  const expectedScore =
    opp1Score !== null && opp2Score !== null ? Math.min(opp1Score, opp2Score) : null;
  return { opp1Score, opp2Score, forcedAttacker, expectedScore };
}

interface AttackerRevealContentProps {
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

function OpponentOptimalCard({
  oppOptimal,
  availableOppAttackers,
  isValid,
}: {
  oppOptimal: { expectedScoreForUs: number; attackers: number[] } | null;
  availableOppAttackers: Player[];
  isValid: boolean;
}) {
  if (!oppOptimal || isValid) return null;
  return (
    <Card className="bg-amber-50 border-amber-200 p-4">
      <h4 className="text-sm font-medium text-amber-800 mb-2">Opponent&apos;s Optimal Play</h4>
      <div className="text-sm text-amber-700">
        Best attackers for them gives us:{' '}
        <ScoreBadge score={oppOptimal.expectedScoreForUs} size="sm" showDelta />
      </div>
      <div className="text-xs text-amber-600 mt-1">
        Optimal pair:{' '}
        {oppOptimal.attackers
          .map((idx) => availableOppAttackers.find((p) => p.index === idx)?.faction)
          .join(' + ')}
      </div>
    </Card>
  );
}

function OpponentComparisonCard({
  opponentComparison,
  isForced,
  oppAttacker1,
  oppAttacker2,
  isValid,
}: {
  opponentComparison: {
    playedOptimally: boolean;
    mistakeMagnitude: number;
    optimalTotalForUs: number;
    optimalPairNames: (string | undefined)[];
    actualTotalForUs: number;
  } | null;
  isForced: boolean;
  oppAttacker1: Player | null;
  oppAttacker2: Player | null;
  isValid: boolean;
}) {
  if (!opponentComparison || !isValid) return null;
  return (
    <Card
      className={`p-4 ${
        opponentComparison.playedOptimally
          ? 'bg-red-50 border-red-200'
          : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">
          {isForced
            ? 'Opponent Had No Choice'
            : opponentComparison.playedOptimally
              ? 'Opponent Played Optimally'
              : 'Opponent Made a Mistake!'}
        </h4>
        {!opponentComparison.playedOptimally && !isForced && (
          <span className="inline-flex items-center rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
            +{opponentComparison.mistakeMagnitude.toFixed(1)} for us
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-gray-500 mb-1">Optimal for Them</div>
          <ScoreBadge score={opponentComparison.optimalTotalForUs} size="sm" showDelta />
          <div className="text-xs text-gray-500 mt-1">
            ({opponentComparison.optimalPairNames.join(' + ')})
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Their Selection</div>
          <ScoreBadge score={opponentComparison.actualTotalForUs} size="sm" showDelta />
          <div className="text-xs text-gray-500 mt-1">
            ({oppAttacker1?.faction} + {oppAttacker2?.faction})
          </div>
        </div>
      </div>
    </Card>
  );
}

function OppAttackerRevealSection({
  isForced,
  availableOppAttackers,
  ourDefenderIndex,
  forcedAttacker,
  getExpectedScore,
  selectedIds,
  handleTogglePlayer,
  reducedMotion,
  itemVariants,
}: {
  isForced: boolean;
  availableOppAttackers: Player[];
  ourDefenderIndex: number;
  forcedAttacker: Player | null;
  getExpectedScore: (ourIdx: number, oppIdx: number) => number;
  selectedIds: Set<string>;
  handleTogglePlayer: (player: Player) => void;
  reducedMotion: boolean;
  itemVariants: typeof listItem | typeof noMotionItem;
}) {
  if (isForced) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600 mb-2">
          Only 2 opponent players remain - they are automatically the attackers:
        </p>
        {availableOppAttackers.map((player) => {
          const score = getExpectedScore(ourDefenderIndex, player.index);
          const isForcedPlayer = forcedAttacker?.id === player.id;
          return (
            <div key={player.id} className="flex items-center gap-2">
              <div className="flex-1">
                <PlayerCard player={player} isOpponent />
              </div>
              <div className="flex flex-col items-center gap-1">
                <ScoreBadge score={score} size="sm" showDelta />
                {isForcedPlayer && <span className="text-xs text-red-600">Forced</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">
        Select the two attackers your opponent has sent against your defender:
      </p>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">{selectedIds.size} of 2 selected</span>
        {selectedIds.size === 2 && <span className="text-xs font-medium text-blue-600">Ready</span>}
      </div>
      <motion.div
        className="space-y-2"
        variants={reducedMotion ? undefined : listContainer}
        initial="initial"
        animate="animate"
      >
        {availableOppAttackers.map((player) => (
          <motion.div key={player.id} variants={itemVariants}>
            <PlayerCard
              player={player}
              isOpponent
              selected={selectedIds.has(player.id)}
              onClick={() => handleTogglePlayer(player)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function OppAttackerRow({
  attacker,
  score,
  isForced,
}: {
  attacker: Player | null;
  score: number | null;
  isForced: boolean;
}) {
  return (
    <div className={isForced ? 'font-bold' : ''}>
      {attacker?.faction}
      {score !== null && <span className="text-gray-500 ml-1">({score})</span>}
      {isForced && <span className="text-red-600 ml-1">*</span>}
    </div>
  );
}

function AttackerSummarySection({
  ourAttackers,
  ourDefender,
  oppDefender,
  oppAttacker1,
  oppAttacker2,
  opp1Score,
  opp2Score,
  forcedAttacker,
  expectedScore,
  isValid,
}: {
  ourAttackers: [Player, Player];
  ourDefender: Player;
  oppDefender: Player;
  oppAttacker1: Player | null;
  oppAttacker2: Player | null;
  opp1Score: number | null;
  opp2Score: number | null;
  forcedAttacker: Player | null;
  expectedScore: number | null;
  isValid: boolean;
}) {
  if (!isValid) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">Attacker Summary</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-center text-gray-500 mb-1">US → Their Defender</div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center text-sm">
            <div>{ourAttackers[0].name}</div>
            <div>{ourAttackers[1].name}</div>
            <div className="text-gray-500 mt-1">→ {oppDefender.faction}</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-center text-gray-500 mb-1">THEM → Our Defender</div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center text-sm">
            <OppAttackerRow
              attacker={oppAttacker1}
              score={opp1Score}
              isForced={forcedAttacker?.id === oppAttacker1?.id}
            />
            <OppAttackerRow
              attacker={oppAttacker2}
              score={opp2Score}
              isForced={forcedAttacker?.id === oppAttacker2?.id}
            />
            <div className="text-gray-500 mt-1">→ {ourDefender.name}</div>
            {expectedScore !== null && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">Expected:</span>
                <ScoreBadge score={expectedScore} size="sm" showDelta />
              </div>
            )}
          </div>
        </div>
      </div>
      {forcedAttacker && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          * Opponent will choose {forcedAttacker.faction} to face {ourDefender.name}
        </p>
      )}
    </div>
  );
}

export function AttackerRevealContent({ round, onNext }: AttackerRevealContentProps) {
  const reducedMotion = useReducedMotion();
  const { haptics } = useHaptic();
  const { matrix, ourRemaining, oppRemaining, getRound, getExpectedScore, setOppAttackers } =
    usePairingStore();

  const roundState = getRound(round);
  const ourDefender = roundState.ourDefender;
  const oppDefender = roundState.oppDefender;
  const ourAttackers = roundState.ourAttackers;

  // Multi-select state: track selected player IDs (max 2)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get available opponent attackers (remaining minus their defender)
  const availableOppAttackers = oppRemaining.filter((p) => p.id !== oppDefender?.id);

  // For round 2, only 2 opponents remain, so auto-select them
  const isForced = availableOppAttackers.length === 2;
  const availableOppAttackerIds = availableOppAttackers.map((p) => p.id).join(',');

  useEffect(() => {
    if (isForced) {
      setSelectedIds(new Set(availableOppAttackerIds.split(',')));
    }
  }, [isForced, availableOppAttackerIds]);

  // Derive selected players from IDs
  const selectedPlayers = useMemo(() => {
    return availableOppAttackers.filter((p) => selectedIds.has(p.id));
  }, [availableOppAttackers, selectedIds]);

  const oppAttacker1 = selectedPlayers[0] ?? null;
  const oppAttacker2 = selectedPlayers[1] ?? null;

  // Analyze opponent's attacker options with full game theory
  const oppAttackerAnalyses = useMemo(() => {
    if (!matrix || !ourDefender || !oppDefender || availableOppAttackers.length < 2) return null;

    const ourAvailable = ourRemaining.filter((p) => p.id !== ourDefender.id).map((p) => p.index);

    return analyzeOpponentAttackerPhase(
      matrix.scores,
      ourDefender.index,
      oppDefender.index,
      ourAvailable,
      availableOppAttackers.map((p) => p.index)
    );
  }, [matrix, ourDefender, oppDefender, ourRemaining, availableOppAttackers]);

  // Get optimal analysis (first in sorted list - best for opponent)
  const oppOptimal = oppAttackerAnalyses?.[0] ?? null;

  // Compare actual selection to optimal
  const opponentComparison = useMemo(() => {
    if (!oppAttackerAnalyses || !oppAttacker1 || !oppAttacker2) return null;

    // Find the analysis for their actual selection
    const actualAnalysis = oppAttackerAnalyses.find(
      (a) =>
        (a.attackers[0] === oppAttacker1.index && a.attackers[1] === oppAttacker2.index) ||
        (a.attackers[0] === oppAttacker2.index && a.attackers[1] === oppAttacker1.index)
    );

    if (!actualAnalysis || !oppOptimal) return null;

    // Mistake magnitude in terms of points they gave up (from their perspective)
    const mistakeMagnitude =
      oppOptimal.totalExpectedValueForOpp - actualAnalysis.totalExpectedValueForOpp;

    return {
      optimalScoreForUs: oppOptimal.expectedScoreForUs,
      optimalTotalForUs: oppOptimal.totalExpectedValueForUs,
      optimalTotalForOpp: oppOptimal.totalExpectedValueForOpp,
      actualScoreForUs: actualAnalysis.expectedScoreForUs,
      actualTotalForUs: actualAnalysis.totalExpectedValueForUs,
      actualTotalForOpp: actualAnalysis.totalExpectedValueForOpp,
      mistakeMagnitude,
      playedOptimally: Math.abs(mistakeMagnitude) < 0.01,
      optimalPairNames: oppOptimal.attackers.map(
        (idx) => availableOppAttackers.find((p) => p.index === idx)?.faction
      ),
    };
  }, [oppAttackerAnalyses, oppOptimal, oppAttacker1, oppAttacker2, availableOppAttackers]);

  if (!ourDefender || !oppDefender || !ourAttackers) {
    return (
      <div className="p-4 text-red-600">Error: Missing data. Please go back and try again.</div>
    );
  }

  const handleTogglePlayer = (player: Player) => {
    haptics.select();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(player.id)) {
        // Deselect
        next.delete(player.id);
      } else if (next.size < 2) {
        // Select (if under limit)
        next.add(player.id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (!oppAttacker1 || !oppAttacker2) return;
    setOppAttackers(round, [oppAttacker1, oppAttacker2]);
    onNext(`defender-${round}-choose` as Phase);
  };

  const isValid = oppAttacker1 && oppAttacker2 && oppAttacker1.id !== oppAttacker2.id;

  const { opp1Score, opp2Score, forcedAttacker, expectedScore } = computeAttackerScores(
    oppAttacker1,
    oppAttacker2,
    ourDefender,
    getExpectedScore
  );

  const itemVariants = reducedMotion ? noMotionItem : listItem;

  return (
    <div className="p-4 space-y-6">
      {/* Our Attackers */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Our Attackers (vs {oppDefender.faction})
        </h3>
        <div className="space-y-2">
          <PlayerCard player={ourAttackers[0]} />
          <PlayerCard player={ourAttackers[1]} />
        </div>
      </div>

      {/* Opponent's Attackers Reveal */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Opponent's Attackers (vs {ourDefender.name})
        </h3>

        <OppAttackerRevealSection
          isForced={isForced}
          availableOppAttackers={availableOppAttackers}
          ourDefenderIndex={ourDefender.index}
          forcedAttacker={forcedAttacker}
          getExpectedScore={getExpectedScore}
          selectedIds={selectedIds}
          handleTogglePlayer={handleTogglePlayer}
          reducedMotion={reducedMotion}
          itemVariants={itemVariants}
        />
      </div>

      <OpponentOptimalCard
        oppOptimal={oppOptimal}
        availableOppAttackers={availableOppAttackers}
        isValid={!!isValid}
      />

      <OpponentComparisonCard
        opponentComparison={opponentComparison}
        isForced={isForced}
        oppAttacker1={oppAttacker1}
        oppAttacker2={oppAttacker2}
        isValid={!!isValid}
      />

      <AttackerSummarySection
        ourAttackers={ourAttackers}
        ourDefender={ourDefender}
        oppDefender={oppDefender}
        oppAttacker1={oppAttacker1}
        oppAttacker2={oppAttacker2}
        opp1Score={opp1Score}
        opp2Score={opp2Score}
        forcedAttacker={forcedAttacker}
        expectedScore={expectedScore}
        isValid={!!isValid}
      />

      <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
        <Button variant="primary" fullWidth disabled={!isValid} onClick={handleConfirm}>
          Continue to Defender Choice
        </Button>
      </div>
    </div>
  );
}

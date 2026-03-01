import { useState, useMemo } from 'react';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { EVBadge } from '@/components/Display/EVBadge';
import { usePairingStore } from '@/store/pairingStore';
import { useHaptic } from '@/hooks/useHaptic';
import { useLockedTotal } from '@/hooks/useLockedTotal';
import { evaluateDefenderChoices } from '@/algorithms/fullGameTheory';
import type { DefenderChoiceAnalysis } from '@/algorithms/fullGameTheory';
import type { Phase, Player } from '@/store/types';
import { getSelectionRoundCount, isFinalSelectionRound } from '@/store/types';

interface DefenderChooseContentProps {
  round: number;
  onNext: (phase: Phase) => void;
}

export function DefenderChooseContent({ round, onNext }: DefenderChooseContentProps) {
  const { haptics } = useHaptic();
  const lockedTotal = useLockedTotal();
  const { matrix, getRound, teamSize, ourRemaining, oppRemaining, choosePairing } =
    usePairingStore();

  const roundState = getRound(round);
  const ourDefender = roundState.ourDefender;
  const oppDefender = roundState.oppDefender;
  const ourAttackers = roundState.ourAttackers;
  const oppAttackers = roundState.oppAttackers;

  // Our defender chooses which opponent attacker to face
  const [ourChoice, setOurChoice] = useState<Player | null>(null);

  // Opponent's defender chooses which of our attackers to face
  const [oppChoice, setOppChoice] = useState<Player | null>(null);

  // Game-theoretic analysis: considers future rounds, not just immediate score
  // Must be called before any early returns to satisfy Rules of Hooks
  const choiceAnalyses = useMemo(() => {
    if (!matrix || !ourDefender || !oppDefender || !ourAttackers || !oppAttackers) return [];
    return evaluateDefenderChoices(
      matrix.scores,
      ourDefender.index,
      oppDefender.index,
      [ourAttackers[0].index, ourAttackers[1].index],
      [oppAttackers[0].index, oppAttackers[1].index],
      ourRemaining.map((p) => p.index),
      oppRemaining.map((p) => p.index)
    );
  }, [matrix, ourDefender, oppDefender, ourAttackers, oppAttackers, ourRemaining, oppRemaining]);

  const handleOurChoice = (player: Player) => {
    haptics.select();
    setOurChoice(player);
  };

  const handleOppChoice = (player: Player) => {
    haptics.select();
    setOppChoice(player);
  };

  if (!matrix || !ourDefender || !oppDefender || !ourAttackers || !oppAttackers) {
    return (
      <div className="p-4 text-red-600">Error: Missing data. Please go back and try again.</div>
    );
  }

  // Get scores for our defender vs each opponent attacker
  const getScoreVsAttacker = (attacker: Player) => {
    return matrix.scores[ourDefender.index]?.[attacker.index] ?? 10;
  };

  // Get scores for each of our attackers vs opponent defender
  const getAttackerScoreVsDefender = (attacker: Player) => {
    return matrix.scores[attacker.index]?.[oppDefender.index] ?? 10;
  };

  const getAnalysisForAttacker = (attacker: Player): DefenderChoiceAnalysis | undefined => {
    return choiceAnalyses.find((a) => a.chosenOppAttacker === attacker.index);
  };

  const handleConfirm = () => {
    if (!ourChoice || !oppChoice) return;

    // Lock pairing 1: Our defender vs opponent attacker we chose
    choosePairing(ourDefender, ourChoice, round);

    // Lock pairing 2: Our attacker they chose vs their defender
    choosePairing(oppChoice, oppDefender, round);

    const selectionRounds = getSelectionRoundCount(teamSize);

    if (round < selectionRounds) {
      // More selection rounds to go
      onNext(`defender-${round + 1}-select` as Phase);
    } else if (isFinalSelectionRound(teamSize, round) && teamSize === 8) {
      // 8v8 final selection round: auto-lock refused + uninvolved pairings
      const state = usePairingStore.getState();
      const remaining = state.ourRemaining;
      const oppRem = state.oppRemaining;

      if (remaining.length === 2 && oppRem.length === 2) {
        // Refused attacker = the one from each side's pair that was NOT chosen
        const ourRefused = ourAttackers!.find((a) => a.id !== oppChoice.id);
        const oppRefused = oppAttackers!.find((a) => a.id !== ourChoice.id);

        // Uninvolved player = the remaining one who was NOT a refused attacker
        const ourUninvolved = remaining.find((p) => p.id !== ourRefused?.id);
        const oppUninvolved = oppRem.find((p) => p.id !== oppRefused?.id);

        if (ourRefused && oppRefused) {
          choosePairing(ourRefused, oppRefused, round);
        }
        if (ourUninvolved && oppUninvolved) {
          choosePairing(ourUninvolved, oppUninvolved, round);
        }
      }

      onNext('final-pairing');
    } else {
      // 5v5 final selection round (round 2 → final-pairing with forced 1v1)
      onNext('final-pairing');
    }
  };

  const isValid = ourChoice && oppChoice;

  return (
    <div className="p-4 space-y-6">
      {/* Our Defender's Choice Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Our Defender Chooses</h3>
        <Card className="p-4">
          <div className="text-center mb-4">
            <div className="font-semibold text-gray-900">{ourDefender.name}</div>
            <div className="text-sm text-gray-500">{ourDefender.faction}</div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            The opponent sent these 2 attackers. Choose which one to face:
          </p>

          <div className="space-y-2">
            {oppAttackers.map((attacker) => {
              const score = getScoreVsAttacker(attacker);
              const analysis = getAnalysisForAttacker(attacker);
              const isSelected = ourChoice?.id === attacker.id;

              return (
                <Card
                  key={attacker.id}
                  onClick={() => handleOurChoice(attacker)}
                  selected={isSelected}
                  className="p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{attacker.faction}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {analysis && (
                        <EVBadge
                          value={analysis.totalExpectedScore + lockedTotal}
                          totalPairings={teamSize}
                          size="sm"
                        />
                      )}
                      <ScoreBadge score={score} showDelta />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Opponent Defender's Choice Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Opponent's Defender Chooses</h3>
        <Card className="p-4">
          <div className="text-center mb-4">
            <div className="font-semibold text-gray-900">{oppDefender.faction}</div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            We sent these 2 attackers. Which one did the opponent choose to face?
          </p>

          <div className="space-y-2 mb-4">
            {ourAttackers.map((attacker) => {
              const score = getAttackerScoreVsDefender(attacker);
              return (
                <PlayerCard
                  key={attacker.id}
                  player={attacker}
                  score={score}
                  selected={oppChoice?.id === attacker.id}
                  onClick={() => handleOppChoice(attacker)}
                />
              );
            })}
          </div>

          <div className="text-sm text-gray-500">
            <em>
              Note: Opponent will typically choose the matchup that's worse for you (lower score).
            </em>
          </div>
        </Card>
      </div>

      {/* Summary of Pairings to Lock */}
      {isValid && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Pairings to Lock</h3>
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{ourDefender.name}</span>
                  <span className="text-gray-500"> vs </span>
                  <span className="font-semibold">{ourChoice.faction}</span>
                </div>
                <ScoreBadge score={getScoreVsAttacker(ourChoice)} showDelta />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{oppChoice.name}</span>
                  <span className="text-gray-500"> vs </span>
                  <span className="font-semibold">{oppDefender.faction}</span>
                </div>
                <ScoreBadge score={getAttackerScoreVsDefender(oppChoice)} showDelta />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
        <Button variant="primary" fullWidth disabled={!isValid} onClick={handleConfirm}>
          {isFinalSelectionRound(teamSize, round)
            ? `Lock ${teamSize === 8 ? '4' : '2 More'} Pairings`
            : round === 1
              ? 'Lock 2 Pairings'
              : 'Lock 2 More Pairings'}
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { PlayerPicker } from '@/components/Inputs/PlayerPicker';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { usePairingStore } from '@/store/pairingStore';
import { analyzeOpponentAttackerPhase } from '@/algorithms/fullGameTheory';
import type { Phase, Player } from '@/store/types';

interface AttackerRevealContentProps {
  round: 1 | 2;
  onNext: (phase: Phase) => void;
}

export function AttackerRevealContent({
  round,
  onNext,
}: AttackerRevealContentProps) {
  const {
    matrix,
    ourRemaining,
    oppRemaining,
    round1,
    round2,
    getExpectedScore,
    setOppAttackers1,
    setOppAttackers2,
  } = usePairingStore();

  const ourDefender = round === 1 ? round1.ourDefender : round2.ourDefender;
  const oppDefender = round === 1 ? round1.oppDefender : round2.oppDefender;
  const ourAttackers = round === 1 ? round1.ourAttackers : round2.ourAttackers;

  const [oppAttacker1, setOppAttacker1] = useState<Player | null>(null);
  const [oppAttacker2, setOppAttacker2] = useState<Player | null>(null);

  // Get available opponent attackers (remaining minus their defender)
  const availableOppAttackers = oppRemaining.filter(
    (p) => p.id !== oppDefender?.id
  );

  // For round 2, only 2 opponents remain, so auto-select them
  const isForced = availableOppAttackers.length === 2;

  useEffect(() => {
    if (isForced && availableOppAttackers.length === 2) {
      setOppAttacker1(availableOppAttackers[0]);
      setOppAttacker2(availableOppAttackers[1]);
    }
  }, [isForced, availableOppAttackers]);

  if (!ourDefender || !oppDefender || !ourAttackers) {
    return (
      <div className="p-4 text-red-600">
        Error: Missing data. Please go back and try again.
      </div>
    );
  }

  const handleConfirm = () => {
    if (!oppAttacker1 || !oppAttacker2) return;

    if (round === 1) {
      setOppAttackers1([oppAttacker1, oppAttacker2]);
      onNext('defender-1-choose');
    } else {
      setOppAttackers2([oppAttacker1, oppAttacker2]);
      onNext('defender-2-choose');
    }
  };

  const isValid = oppAttacker1 && oppAttacker2 && oppAttacker1.id !== oppAttacker2.id;

  // Calculate expected scores for opponent's attackers vs our defender
  const opp1Score = oppAttacker1 ? getExpectedScore(ourDefender.index, oppAttacker1.index) : null;
  const opp2Score = oppAttacker2 ? getExpectedScore(ourDefender.index, oppAttacker2.index) : null;

  // Determine which attacker is forced (opponent will pick the one with lower score for us)
  const forcedAttacker = opp1Score !== null && opp2Score !== null
    ? (opp1Score <= opp2Score ? oppAttacker1 : oppAttacker2)
    : null;
  const expectedScore = opp1Score !== null && opp2Score !== null
    ? Math.min(opp1Score, opp2Score)
    : null;

  // Analyze opponent's attacker options with full game theory
  const oppAttackerAnalyses = useMemo(() => {
    if (!matrix || !ourDefender || !oppDefender || availableOppAttackers.length < 2) return null;

    const ourAvailable = ourRemaining
      .filter(p => p.id !== ourDefender.id)
      .map(p => p.index);

    return analyzeOpponentAttackerPhase(
      matrix.scores,
      ourDefender.index,
      oppDefender.index,
      ourAvailable,
      availableOppAttackers.map(p => p.index)
    );
  }, [matrix, ourDefender, oppDefender, ourRemaining, availableOppAttackers]);

  // Get optimal analysis (first in sorted list - best for opponent)
  const oppOptimal = oppAttackerAnalyses?.[0] ?? null;

  // Compare actual selection to optimal
  const opponentComparison = useMemo(() => {
    if (!oppAttackerAnalyses || !oppAttacker1 || !oppAttacker2) return null;

    // Find the analysis for their actual selection
    const actualAnalysis = oppAttackerAnalyses.find(a =>
      (a.attackers[0] === oppAttacker1.index && a.attackers[1] === oppAttacker2.index) ||
      (a.attackers[0] === oppAttacker2.index && a.attackers[1] === oppAttacker1.index)
    );

    if (!actualAnalysis || !oppOptimal) return null;

    // Mistake magnitude in terms of points they gave up (from their perspective)
    const mistakeMagnitude = oppOptimal.totalExpectedValueForOpp - actualAnalysis.totalExpectedValueForOpp;

    return {
      optimalScoreForUs: oppOptimal.expectedScoreForUs,
      optimalTotalForOpp: oppOptimal.totalExpectedValueForOpp,
      actualScoreForUs: actualAnalysis.expectedScoreForUs,
      actualTotalForOpp: actualAnalysis.totalExpectedValueForOpp,
      mistakeMagnitude,
      playedOptimally: Math.abs(mistakeMagnitude) < 0.01,
      optimalPairNames: oppOptimal.attackers.map(idx =>
        availableOppAttackers.find(p => p.index === idx)?.name
      ),
    };
  }, [oppAttackerAnalyses, oppOptimal, oppAttacker1, oppAttacker2, availableOppAttackers]);

  return (
    <div className="p-4 space-y-6">
      {/* Our Attackers */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Our Attackers (vs {oppDefender.name})
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

        {isForced ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">
              Only 2 opponent players remain - they are automatically the
              attackers:
            </p>
            {availableOppAttackers.map((player) => {
              const score = getExpectedScore(ourDefender.index, player.index);
              const isForced = forcedAttacker?.id === player.id;
              return (
                <div key={player.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <PlayerCard player={player} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ScoreBadge score={score} size="sm" showDelta />
                    {isForced && (
                      <span className="text-xs text-red-600">Forced</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Select the two attackers your opponent has sent against your
              defender:
            </p>
            <div className="space-y-4">
              <PlayerPicker
                players={availableOppAttackers}
                value={oppAttacker1}
                onChange={setOppAttacker1}
                placeholder="Select first attacker..."
                label="First Attacker"
                useModal
                disabledPlayers={oppAttacker2 ? [oppAttacker2] : []}
              />
              <PlayerPicker
                players={availableOppAttackers}
                value={oppAttacker2}
                onChange={setOppAttacker2}
                placeholder="Select second attacker..."
                label="Second Attacker"
                useModal
                disabledPlayers={oppAttacker1 ? [oppAttacker1] : []}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Opponent Analysis - Before Selection */}
      {oppOptimal && !isValid && (
        <Card className="bg-amber-50 border-amber-200 p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">
            Opponent's Optimal Play
          </h4>
          <div className="text-sm text-amber-700">
            Best attackers for them gives us:{' '}
            <ScoreBadge score={oppOptimal.expectedScoreForUs} size="sm" showDelta />
          </div>
          <div className="text-xs text-amber-600 mt-1">
            Optimal pair: {oppOptimal.attackers.map(idx =>
              availableOppAttackers.find(p => p.index === idx)?.name
            ).join(' + ')}
          </div>
        </Card>
      )}

      {/* Opponent Analysis - After Selection */}
      {opponentComparison && isValid && (
        <Card className={`p-4 ${opponentComparison.playedOptimally
          ? 'bg-red-50 border-red-200'
          : 'bg-green-50 border-green-200'}`}>
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
              <ScoreBadge score={opponentComparison.optimalScoreForUs} size="sm" showDelta />
              <div className="text-xs text-gray-500 mt-1">
                ({opponentComparison.optimalPairNames.join(' + ')})
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Their Selection</div>
              <ScoreBadge score={opponentComparison.actualScoreForUs} size="sm" showDelta />
              <div className="text-xs text-gray-500 mt-1">
                ({oppAttacker1?.name} + {oppAttacker2?.name})
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary */}
      {isValid && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Attacker Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-center text-gray-500 mb-1">
                US → Their Defender
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center text-sm">
                <div>{ourAttackers[0].name}</div>
                <div>{ourAttackers[1].name}</div>
                <div className="text-gray-500 mt-1">→ {oppDefender.name}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-center text-gray-500 mb-1">
                THEM → Our Defender
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center text-sm">
                <div className={forcedAttacker?.id === oppAttacker1?.id ? 'font-bold' : ''}>
                  {oppAttacker1?.name}
                  {opp1Score !== null && <span className="text-gray-500 ml-1">({opp1Score})</span>}
                  {forcedAttacker?.id === oppAttacker1?.id && <span className="text-red-600 ml-1">*</span>}
                </div>
                <div className={forcedAttacker?.id === oppAttacker2?.id ? 'font-bold' : ''}>
                  {oppAttacker2?.name}
                  {opp2Score !== null && <span className="text-gray-500 ml-1">({opp2Score})</span>}
                  {forcedAttacker?.id === oppAttacker2?.id && <span className="text-red-600 ml-1">*</span>}
                </div>
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
              * Opponent will choose {forcedAttacker.name} to face {ourDefender.name}
            </p>
          )}
        </div>
      )}

      <div className="sticky bottom-0 pt-4 pb-4 -mx-4 px-4 bg-white border-t border-gray-200">
        <Button
          variant="primary"
          fullWidth
          disabled={!isValid}
          onClick={handleConfirm}
        >
          Continue to Defender Choice
        </Button>
      </div>
    </div>
  );
}

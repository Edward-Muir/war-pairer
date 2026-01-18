import { useState } from 'react';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { usePairingStore } from '@/store/pairingStore';
import type { Phase, Player } from '@/store/types';

interface DefenderChooseContentProps {
  round: 1 | 2;
  onNext: (phase: Phase) => void;
}

export function DefenderChooseContent({
  round,
  onNext,
}: DefenderChooseContentProps) {
  const {
    matrix,
    round1,
    round2,
    choosePairing,
  } = usePairingStore();

  const ourDefender = round === 1 ? round1.ourDefender : round2.ourDefender;
  const oppDefender = round === 1 ? round1.oppDefender : round2.oppDefender;
  const ourAttackers = round === 1 ? round1.ourAttackers : round2.ourAttackers;
  const oppAttackers = round === 1 ? round1.oppAttackers : round2.oppAttackers;

  // Our defender chooses which opponent attacker to face
  const [ourChoice, setOurChoice] = useState<Player | null>(null);

  // Opponent's defender chooses which of our attackers to face
  const [oppChoice, setOppChoice] = useState<Player | null>(null);

  if (!matrix || !ourDefender || !oppDefender || !ourAttackers || !oppAttackers) {
    return (
      <div className="p-4 text-red-600">
        Error: Missing data. Please go back and try again.
      </div>
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

  // Determine recommended choices (higher score is better for us)
  const ourScores = oppAttackers.map((a) => ({
    player: a,
    score: getScoreVsAttacker(a),
  }));
  const recommendedOurChoice =
    ourScores[0].score >= ourScores[1].score
      ? oppAttackers[0]
      : oppAttackers[1];

  const handleConfirm = () => {
    if (!ourChoice || !oppChoice) return;

    // Lock pairing 1: Our defender vs opponent attacker we chose
    choosePairing(ourDefender, ourChoice, round);

    // Lock pairing 2: Our attacker they chose vs their defender
    choosePairing(oppChoice, oppDefender, round);

    // Navigate to next phase
    if (round === 1) {
      onNext('defender-2-select');
    } else {
      onNext('final-pairing');
    }
  };

  const isValid = ourChoice && oppChoice;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Our Defender's Choice Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Our Defender Chooses
          </h3>
          <Card className="p-4">
            <div className="text-center mb-4">
              <div className="font-semibold text-gray-900">
                {ourDefender.name}
              </div>
              <div className="text-sm text-gray-500">
                {ourDefender.faction}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              The opponent sent these 2 attackers. Choose which one to face:
            </p>

            <div className="space-y-2">
              {oppAttackers.map((attacker) => {
                const score = getScoreVsAttacker(attacker);
                const isRecommended = attacker.id === recommendedOurChoice.id;
                const isSelected = ourChoice?.id === attacker.id;

                return (
                  <Card
                    key={attacker.id}
                    onClick={() => setOurChoice(attacker)}
                    selected={isSelected}
                    className="p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {attacker.name}
                            </span>
                            {isRecommended && (
                              <span className="inline-flex items-center rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                                Better
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attacker.faction}
                          </div>
                        </div>
                      </div>
                      <ScoreBadge score={score} showDelta />
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Opponent Defender's Choice Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Opponent's Defender Chooses
          </h3>
          <Card className="p-4">
            <div className="text-center mb-4">
              <div className="font-semibold text-gray-900">
                {oppDefender.name}
              </div>
              <div className="text-sm text-gray-500">
                {oppDefender.faction}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              We sent these 2 attackers. Which one did the opponent choose to
              face?
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
                    onClick={() => setOppChoice(attacker)}
                  />
                );
              })}
            </div>

            <div className="text-sm text-gray-500">
              <em>
                Note: Opponent will typically choose the matchup that's worse
                for you (lower score).
              </em>
            </div>
          </Card>
        </div>

        {/* Summary of Pairings to Lock */}
        {isValid && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Pairings to Lock
            </h3>
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{ourDefender.name}</span>
                    <span className="text-gray-500"> vs </span>
                    <span className="font-semibold">{ourChoice.name}</span>
                  </div>
                  <ScoreBadge score={getScoreVsAttacker(ourChoice)} showDelta />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{oppChoice.name}</span>
                    <span className="text-gray-500"> vs </span>
                    <span className="font-semibold">{oppDefender.name}</span>
                  </div>
                  <ScoreBadge
                    score={getAttackerScoreVsDefender(oppChoice)}
                    showDelta
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <Button
          variant="primary"
          fullWidth
          disabled={!isValid}
          onClick={handleConfirm}
        >
          Lock {round === 1 ? '2' : '2 More'} Pairings
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { PlayerPicker } from '@/components/Inputs/PlayerPicker';
import { usePairingStore } from '@/store/pairingStore';
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
    oppRemaining,
    round1,
    round2,
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-6">
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
              {availableOppAttackers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
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
                  <div>{oppAttacker1?.name}</div>
                  <div>{oppAttacker2?.name}</div>
                  <div className="text-gray-500 mt-1">→ {ourDefender.name}</div>
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
          Continue to Defender Choice
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerCard } from '@/components/Cards/PlayerCard';
import { PlayerPicker } from '@/components/Inputs/PlayerPicker';
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
  const { round1, round2, oppRemaining, setOppDefender1, setOppDefender2 } =
    usePairingStore();

  const ourDefender = round === 1 ? round1.ourDefender : round2.ourDefender;
  const [selectedOppDefender, setSelectedOppDefender] = useState<Player | null>(
    null
  );

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

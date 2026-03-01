import { usePairingStore } from '@/store/pairingStore';
import { generatePairingPhases } from '@/store/types';
import type { Phase } from '@/store/types';

interface PhaseIndicatorProps {
  currentPhase: Phase;
}

function getPhaseLabel(phase: Phase): string {
  if (phase === 'final-pairing') return 'Final';
  const match = (phase as string).match(/^(defender|attacker)-(\d+)-(select|reveal|choose)$/);
  if (!match) return '';
  const [, type, roundNum, action] = match;
  if (action === 'select') return type === 'defender' ? `Def ${roundNum}` : `Att ${roundNum}`;
  if (action === 'reveal') return 'Reveal';
  if (action === 'choose') return 'Choose';
  return '';
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const teamSize = usePairingStore((s) => s.teamSize);
  const pairingPhases = generatePairingPhases(teamSize);

  const currentIndex = pairingPhases.indexOf(currentPhase);

  // Don't render if not in a pairing phase
  if (currentIndex === -1) {
    return null;
  }

  const stepNumber = currentIndex + 1;
  const totalSteps = pairingPhases.length;

  return (
    <div className="bg-gray-100 px-4 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-blue-600">{getPhaseLabel(currentPhase)}</span>
        <span className="text-xs text-gray-500">
          Step {stepNumber} of {totalSteps}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${(stepNumber / totalSteps) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

import type { Phase } from '@/store/types';

interface PhaseIndicatorProps {
  currentPhase: Phase;
}

const pairingPhases: Phase[] = [
  'defender-1-select',
  'defender-1-reveal',
  'attacker-1-select',
  'attacker-1-reveal',
  'defender-1-choose',
  'defender-2-select',
  'defender-2-reveal',
  'attacker-2-select',
  'attacker-2-reveal',
  'defender-2-choose',
  'final-pairing',
];

const phaseLabels: Partial<Record<Phase, string>> = {
  'defender-1-select': 'Def 1',
  'defender-1-reveal': 'Reveal',
  'attacker-1-select': 'Att 1',
  'attacker-1-reveal': 'Reveal',
  'defender-1-choose': 'Choose',
  'defender-2-select': 'Def 2',
  'defender-2-reveal': 'Reveal',
  'attacker-2-select': 'Att 2',
  'attacker-2-reveal': 'Reveal',
  'defender-2-choose': 'Choose',
  'final-pairing': 'Final',
};

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIndex = pairingPhases.indexOf(currentPhase);

  // Don't render if not in a pairing phase
  if (currentIndex === -1) {
    return null;
  }

  return (
    <div className="bg-gray-100 px-4 py-2">
      <div className="flex items-center justify-between gap-1">
        {pairingPhases.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={phase} className="flex-1 flex flex-col items-center">
              {/* Dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  isCompleted
                    ? 'bg-blue-600'
                    : isCurrent
                      ? 'bg-blue-600 ring-2 ring-blue-200'
                      : 'bg-gray-300'
                }`}
              />
              {/* Label - only show for current */}
              <span
                className={`text-[10px] mt-1 truncate max-w-full ${
                  isCurrent ? 'text-blue-600 font-medium' : 'text-transparent'
                }`}
              >
                {phaseLabels[phase]}
              </span>
            </div>
          );
        })}
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / pairingPhases.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

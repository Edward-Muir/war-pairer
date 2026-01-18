import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { usePairingStore } from '@/store/pairingStore';
import type { Phase } from '@/store/types';

// Phase content components
import { DefenderSelectContent } from './pairing/DefenderSelectContent';
import { DefenderRevealContent } from './pairing/DefenderRevealContent';
import { AttackerSelectContent } from './pairing/AttackerSelectContent';
import { AttackerRevealContent } from './pairing/AttackerRevealContent';
import { DefenderChooseContent } from './pairing/DefenderChooseContent';
import { FinalPairingContent } from './pairing/FinalPairingContent';

// Phase to round mapping
const phaseRound: Record<string, 1 | 2> = {
  'defender-1-select': 1,
  'defender-1-reveal': 1,
  'attacker-1-select': 1,
  'attacker-1-reveal': 1,
  'defender-1-choose': 1,
  'defender-2-select': 2,
  'defender-2-reveal': 2,
  'attacker-2-select': 2,
  'attacker-2-reveal': 2,
  'defender-2-choose': 2,
};

// Phase titles for header
const phaseTitles: Record<string, string> = {
  'defender-1-select': 'Round 1: Select Defender',
  'defender-1-reveal': 'Round 1: Reveal Defenders',
  'attacker-1-select': 'Round 1: Select Attackers',
  'attacker-1-reveal': 'Round 1: Reveal Attackers',
  'defender-1-choose': 'Round 1: Defender Chooses',
  'defender-2-select': 'Round 2: Select Defender',
  'defender-2-reveal': 'Round 2: Reveal Defenders',
  'attacker-2-select': 'Round 2: Select Attackers',
  'attacker-2-reveal': 'Round 2: Reveal Attackers',
  'defender-2-choose': 'Round 2: Defender Chooses',
  'final-pairing': 'Final Pairing',
};

export function PairingPhasePage() {
  const { id, roundIndex, phase } = useParams<{
    id: string;
    roundIndex: string;
    phase: string;
  }>();
  const navigate = useNavigate();
  const { setPhase, matrix } = usePairingStore();

  const goToPhase = (nextPhase: Phase) => {
    setPhase(nextPhase);
    navigate(`/tournament/${id}/round/${roundIndex}/pairing/${nextPhase}`);
  };

  const goToSummary = () => {
    navigate(`/tournament/${id}/round/${roundIndex}/summary`);
  };

  const goBack = () => {
    navigate(-1);
  };

  // Show error if no matrix loaded
  if (!matrix) {
    return (
      <Layout title="Pairing" showBack onBack={goBack} showNav={false}>
        <div className="p-4">
          <p className="text-red-600">
            No pairing session found. Please start from the matrix entry page.
          </p>
        </div>
      </Layout>
    );
  }

  const currentPhase = phase as Phase;
  const title = phaseTitles[currentPhase] || 'Pairing';
  const round = phaseRound[currentPhase] as 1 | 2 | undefined;

  // Render phase-specific content
  const renderContent = () => {
    switch (currentPhase) {
      case 'defender-1-select':
      case 'defender-2-select':
        return <DefenderSelectContent round={round!} onNext={goToPhase} />;

      case 'defender-1-reveal':
      case 'defender-2-reveal':
        return <DefenderRevealContent round={round!} onNext={goToPhase} />;

      case 'attacker-1-select':
      case 'attacker-2-select':
        return <AttackerSelectContent round={round!} onNext={goToPhase} />;

      case 'attacker-1-reveal':
      case 'attacker-2-reveal':
        return <AttackerRevealContent round={round!} onNext={goToPhase} />;

      case 'defender-1-choose':
      case 'defender-2-choose':
        return <DefenderChooseContent round={round!} onNext={goToPhase} />;

      case 'final-pairing':
        return <FinalPairingContent onComplete={goToSummary} />;

      default:
        return (
          <div className="p-4">
            <p className="text-gray-600">Unknown phase: {currentPhase}</p>
          </div>
        );
    }
  };

  return (
    <Layout
      title={title}
      showBack
      onBack={goBack}
      showNav={false}
      currentPhase={currentPhase}
    >
      {renderContent()}
    </Layout>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { List } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ConfirmationModal } from '@/components/Common/ConfirmationModal';
import { LockedPairingsDrawer } from '@/components/Drawers/LockedPairingsDrawer';
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

// Phase-aware back navigation mapping
const previousPhaseMap: Record<string, Phase | 'confirm-abandon'> = {
  'defender-1-select': 'confirm-abandon', // First phase - show abandon confirmation
  'defender-1-reveal': 'defender-1-select',
  'attacker-1-select': 'defender-1-reveal',
  'attacker-1-reveal': 'attacker-1-select',
  'defender-1-choose': 'attacker-1-reveal',
  'defender-2-select': 'defender-1-choose',
  'defender-2-reveal': 'defender-2-select',
  'attacker-2-select': 'defender-2-reveal',
  'attacker-2-reveal': 'attacker-2-select',
  'defender-2-choose': 'attacker-2-reveal',
  'final-pairing': 'defender-2-choose',
};

export function PairingPhasePage() {
  const { id, roundIndex, phase } = useParams<{
    id: string;
    roundIndex: string;
    phase: string;
  }>();
  const navigate = useNavigate();
  const { setPhase, matrix, pairings, reset: resetPairingStore } = usePairingStore();

  // UI state
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showPairingsDrawer, setShowPairingsDrawer] = useState(false);

  const goToPhase = (nextPhase: Phase) => {
    setPhase(nextPhase);
    navigate(`/tournament/${id}/round/${roundIndex}/pairing/${nextPhase}`);
  };

  const goToSummary = () => {
    navigate(`/tournament/${id}/round/${roundIndex}/summary`);
  };

  const goBack = () => {
    const currentPhase = phase as Phase;
    const previousPhase = previousPhaseMap[currentPhase];

    if (previousPhase === 'confirm-abandon') {
      // First pairing phase - show confirmation before abandoning
      setShowAbandonConfirm(true);
    } else if (previousPhase) {
      // Navigate to previous pairing phase
      setPhase(previousPhase);
      navigate(`/tournament/${id}/round/${roundIndex}/pairing/${previousPhase}`);
    } else {
      // Unknown phase - fallback to matrix
      navigate(`/tournament/${id}/round/${roundIndex}/matrix`);
    }
  };

  const handleAbandonConfirm = () => {
    resetPairingStore();
    navigate(`/tournament/${id}/round/${roundIndex}/matrix`);
  };

  // Show error if no matrix loaded
  if (!matrix) {
    return (
      <Layout title="Pairing" showBack onBack={() => navigate(-1)} showNav={false}>
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

  // Header right action - toggle button for locked pairings drawer
  const pairingsToggleButton = (
    <button
      onClick={() => setShowPairingsDrawer(true)}
      className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      aria-label={`View locked pairings (${pairings.length})`}
    >
      <List className="h-5 w-5" />
      {pairings.length > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
          {pairings.length}
        </span>
      )}
    </button>
  );

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
    <>
      <Layout
        title={title}
        showBack
        onBack={goBack}
        showNav={false}
        currentPhase={currentPhase}
        rightAction={pairingsToggleButton}
      >
        {renderContent()}
      </Layout>

      {/* Abandon Pairing Confirmation */}
      <ConfirmationModal
        isOpen={showAbandonConfirm}
        onClose={() => setShowAbandonConfirm(false)}
        onConfirm={handleAbandonConfirm}
        title="Abandon Pairing?"
        message="Your pairing progress will be lost. You can start again from the matrix entry."
        confirmText="Abandon"
        cancelText="Continue Pairing"
        variant="warning"
      />

      {/* Locked Pairings Drawer */}
      <LockedPairingsDrawer
        isOpen={showPairingsDrawer}
        onClose={() => setShowPairingsDrawer(false)}
        pairings={pairings}
      />
    </>
  );
}

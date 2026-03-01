import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { List, Home } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ConfirmationModal } from '@/components/Common/ConfirmationModal';
import { LockedPairingsDrawer } from '@/components/Drawers/LockedPairingsDrawer';
import { usePairingStore } from '@/store/pairingStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Phase } from '@/store/types';
import { generatePreviousPhaseMap } from '@/store/types';

// Phase content components
import { DefenderSelectContent } from './pairing/DefenderSelectContent';
import { DefenderRevealContent } from './pairing/DefenderRevealContent';
import { AttackerSelectContent } from './pairing/AttackerSelectContent';
import { AttackerRevealContent } from './pairing/AttackerRevealContent';
import { DefenderChooseContent } from './pairing/DefenderChooseContent';
import { FinalPairingContent } from './pairing/FinalPairingContent';

function getPhaseRound(phase: string): number | undefined {
  const match = phase.match(/^(?:defender|attacker)-(\d+)-/);
  return match ? parseInt(match[1], 10) : undefined;
}

function getPhaseTitle(phase: string): string {
  if (phase === 'final-pairing') return 'Final Pairing';
  const round = getPhaseRound(phase);
  if (!round) return 'Pairing';
  if (phase.startsWith('defender') && phase.endsWith('-select'))
    return `Round ${round}: Select Defender`;
  if (phase.startsWith('defender') && phase.endsWith('-reveal'))
    return `Round ${round}: Reveal Defenders`;
  if (phase.startsWith('attacker') && phase.endsWith('-select'))
    return `Round ${round}: Select Attackers`;
  if (phase.startsWith('attacker') && phase.endsWith('-reveal'))
    return `Round ${round}: Reveal Attackers`;
  if (phase.endsWith('-choose')) return `Round ${round}: Defender Chooses`;
  return 'Pairing';
}

export function PairingPhasePage() {
  const { id, phase } = useParams<{
    id: string;
    phase: string;
  }>();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { setPhase, matrix, pairings, teamSize, reset: resetPairingStore } = usePairingStore();

  // UI state
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showPairingsDrawer, setShowPairingsDrawer] = useState(false);

  const goToPhase = (nextPhase: Phase) => {
    setPhase(nextPhase);
    navigate(`/game/${id}/pairing/${nextPhase}`);
  };

  const goToSummary = () => {
    navigate(`/game/${id}/summary`);
  };

  const goBack = () => {
    const currentPhase = phase as Phase;
    const prevMap = generatePreviousPhaseMap(teamSize);
    const previousPhase = prevMap[currentPhase];

    if (previousPhase === 'confirm-abandon') {
      // First pairing phase - show confirmation before abandoning
      setShowAbandonConfirm(true);
    } else if (previousPhase) {
      // Navigate to previous pairing phase
      setPhase(previousPhase);
      navigate(`/game/${id}/pairing/${previousPhase}`);
    } else {
      // Unknown phase - fallback to matrix
      navigate(`/game/${id}/matrix`);
    }
  };

  const handleAbandonConfirm = () => {
    resetPairingStore();
    navigate(`/game/${id}/matrix`);
  };

  // Show error if no matrix loaded
  if (!matrix) {
    return (
      <Layout title="Pairing" showBack onBack={() => navigate(-1)}>
        <div className="p-4">
          <p className="text-red-600">
            No pairing session found. Please start from the matrix entry page.
          </p>
        </div>
      </Layout>
    );
  }

  const currentPhase = phase as Phase;
  const title = getPhaseTitle(currentPhase);
  const round = getPhaseRound(currentPhase);

  // Header right actions
  const headerRightActions = (
    <>
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
      <button
        onClick={() => navigate('/')}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        aria-label="Go home"
      >
        <Home className="h-5 w-5" />
      </button>
    </>
  );

  // Render phase-specific content based on phase suffix
  const renderContent = () => {
    if (currentPhase === 'final-pairing') {
      return <FinalPairingContent onComplete={goToSummary} />;
    }
    if (round === undefined) {
      return (
        <div className="p-4">
          <p className="text-gray-600">Unknown phase: {currentPhase}</p>
        </div>
      );
    }
    const suffix = currentPhase.replace(/^(?:defender|attacker)-\d+-/, '');
    const type = currentPhase.startsWith('defender-') ? 'defender' : 'attacker';
    const key = `${type}-${suffix}`;
    switch (key) {
      case 'defender-select':
        return <DefenderSelectContent round={round} onNext={goToPhase} />;
      case 'defender-reveal':
        return <DefenderRevealContent round={round} onNext={goToPhase} />;
      case 'attacker-select':
        return <AttackerSelectContent round={round} onNext={goToPhase} />;
      case 'attacker-reveal':
        return <AttackerRevealContent round={round} onNext={goToPhase} />;
      case 'defender-choose':
        return <DefenderChooseContent round={round} onNext={goToPhase} />;
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
        currentPhase={currentPhase}
        rightAction={headerRightActions}
        hideMenu
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={reducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
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

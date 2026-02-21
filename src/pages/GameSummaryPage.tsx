import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { MatchupPreview } from '@/components/Display/MatchupPreview';
import { ScorePickerCell } from '@/components/Inputs/ScorePickerCell';
import { ScorePickerPopover } from '@/components/Inputs/ScorePickerPopover';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { usePairingStore } from '@/store/pairingStore';
import { useGameStore } from '@/store/gameStore';
import { calculateRoundTotals } from '@/utils/scoring';
import type { Pairing } from '@/store/types';

export function GameSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Pairing store - for fresh pairings from just-completed pairing flow
  const {
    pairings: sessionPairings,
    gameId: sessionGameId,
    reset: resetPairingStore,
    initializeFromGame,
    undoLastPairing,
    setPhase,
  } = usePairingStore();

  // Game store
  const { getGame, completeGame, updateActualScore } = useGameStore();
  const game = getGame(id ?? '');

  // State for score picker popover
  const [activePairingIndex, setActivePairingIndex] = useState<number | null>(null);

  // Use session pairings if we just completed pairing, otherwise load from game
  const isFromSession =
    sessionGameId === id &&
    sessionPairings.length === 5;

  const pairings: Pairing[] = useMemo(() => {
    if (isFromSession) {
      return sessionPairings;
    }
    return game?.pairings ?? [];
  }, [isFromSession, sessionPairings, game?.pairings]);

  // Calculate totals
  const { expectedTotal, actualTotal, allScoresEntered } = useMemo(
    () => calculateRoundTotals(pairings),
    [pairings]
  );

  // Handlers
  const handleScoreSelect = (score: number) => {
    if (activePairingIndex !== null && id) {
      updateActualScore(id, activePairingIndex, score);
    }
    setActivePairingIndex(null);
  };

  const handleFinish = () => {
    if (isFromSession && id) {
      completeGame(id, sessionPairings);
    }
    resetPairingStore();
    navigate('/');
  };

  const handleBack = () => {
    // If we have an active session for this game, go back to the pairing flow
    if (isFromSession && id) {
      // Undo the final (round 3) pairing so FinalPairingContent has its data
      undoLastPairing();
      setPhase('final-pairing');
      navigate(`/game/${id}/pairing/final-pairing`);
      return;
    }
    navigate('/');
  };

  const handleEditPairings = () => {
    if (!id) return;
    initializeFromGame(id);
    navigate(`/game/${id}/matrix`);
  };

  // Error states
  if (!game) {
    return (
      <Layout title="Game Summary" showBack onBack={() => navigate('/')}>
        <div className="p-4 text-center">
          <p className="text-gray-600">Game not found</p>
          <div className="mt-4">
            <Button variant="primary" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (pairings.length === 0) {
    return (
      <Layout title="Game Summary" showBack onBack={handleBack}>
        <div className="p-4 text-center">
          <p className="text-gray-600">No pairings found for this game</p>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() => navigate(`/game/${id}/matrix`)}
            >
              Start Pairing
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const opponentName = game.opponentTeamName ?? 'Opponent';

  return (
    <Layout
      title="Game Summary"
      showBack
      onBack={handleBack}
      rightAction={isFromSession ? (
        <button
          onClick={() => navigate('/')}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Go home"
        >
          <Home className="h-5 w-5" />
        </button>
      ) : undefined}
    >
      <div className="p-4 space-y-4">
        {/* Opponent name */}
        <div className="text-center">
          <p className="text-sm text-gray-500">vs</p>
          <p className="text-lg font-semibold text-gray-900">{opponentName}</p>
        </div>

        {/* Pairings list */}
        <Card className="p-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Pairings
          </h2>
          <div className="space-y-3">
            {pairings.map((pairing, index) => (
              <div key={index} className="space-y-2">
                <MatchupPreview
                  ourPlayer={pairing.ourPlayer}
                  oppPlayer={pairing.oppPlayer}
                  expectedScore={pairing.expectedScore}
                  actualScore={pairing.actualScore}
                  round={pairing.round}
                  compact
                />
                {/* Actual score input */}
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-gray-500">Actual:</span>
                  <ScorePickerCell
                    value={pairing.actualScore ?? 10}
                    onTap={() => setActivePairingIndex(index)}
                    showColorCoding
                    aria-label={`Actual score for ${pairing.ourPlayer.name} vs ${pairing.oppPlayer.faction}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Score summary */}
        <Card className="p-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Game Score
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Expected Total</span>
              <ScoreBadge score={expectedTotal} size="md" />
            </div>
            {actualTotal !== null && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Actual Total</span>
                  <ScoreBadge score={actualTotal} size="md" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Difference</span>
                  <span
                    className={`font-semibold ${
                      actualTotal >= expectedTotal
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {actualTotal >= expectedTotal ? '+' : ''}
                    {actualTotal - expectedTotal}
                  </span>
                </div>
              </>
            )}
            {!allScoresEntered && (
              <p className="text-xs text-gray-400 pt-2">
                Enter actual scores after games are played
              </p>
            )}
          </div>
        </Card>

        {/* Action buttons */}
        <div className="space-y-2 pt-4">
          {isFromSession ? (
            <Button variant="primary" fullWidth onClick={handleFinish}>
              Finish Game
            </Button>
          ) : (
            <>
              <Button variant="primary" fullWidth onClick={handleBack}>
                Done
              </Button>
              <Button variant="secondary" fullWidth onClick={handleEditPairings}>
                Edit Pairings
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Score picker popover - shared across all pairings */}
      <ScorePickerPopover
        isOpen={activePairingIndex !== null}
        value={activePairingIndex !== null ? (pairings[activePairingIndex]?.actualScore ?? 10) : 10}
        ourFaction={activePairingIndex !== null ? pairings[activePairingIndex]?.ourPlayer.faction : undefined}
        oppFaction={activePairingIndex !== null ? pairings[activePairingIndex]?.oppPlayer.faction : undefined}
        onSelect={handleScoreSelect}
        onClose={() => setActivePairingIndex(null)}
      />
    </Layout>
  );
}

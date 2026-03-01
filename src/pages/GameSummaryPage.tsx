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
import type { Game, Pairing } from '@/store/types';

function ScoreSummaryCard({
  expectedTotal,
  actualTotal,
  allScoresEntered,
}: {
  expectedTotal: number;
  actualTotal: number | null;
  allScoresEntered: boolean;
}) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Game Score</h2>
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
                  actualTotal >= expectedTotal ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {actualTotal >= expectedTotal ? '+' : ''}
                {actualTotal - expectedTotal}
              </span>
            </div>
          </>
        )}
        {!allScoresEntered && (
          <p className="text-xs text-gray-400 pt-2">Enter actual scores after games are played</p>
        )}
      </div>
    </Card>
  );
}

function GameSummaryContent({
  game,
  pairings,
  isFromSession,
  onBack,
  onFinish,
  onEditPairings,
  onScoreSelect,
}: {
  game: Game;
  pairings: Pairing[];
  isFromSession: boolean;
  onBack: () => void;
  onFinish: () => void;
  onEditPairings: () => void;
  onScoreSelect: (index: number, score: number) => void;
}) {
  const navigate = useNavigate();
  const [activePairingIndex, setActivePairingIndex] = useState<number | null>(null);

  const { expectedTotal, actualTotal, allScoresEntered } = useMemo(
    () => calculateRoundTotals(pairings),
    [pairings]
  );

  const handleScoreSelect = (score: number) => {
    onScoreSelect(activePairingIndex!, score);
    setActivePairingIndex(null);
  };

  const opponentName = game.opponentTeamName || 'Opponent';
  const activePairing = activePairingIndex !== null ? pairings[activePairingIndex] : undefined;

  return (
    <Layout
      title="Game Summary"
      showBack
      onBack={onBack}
      rightAction={
        isFromSession ? (
          <button
            onClick={() => navigate('/')}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Go home"
          >
            <Home className="h-5 w-5" />
          </button>
        ) : undefined
      }
    >
      <div className="p-4 space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">vs</p>
          <p className="text-lg font-semibold text-gray-900">{opponentName}</p>
        </div>

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

        <ScoreSummaryCard
          expectedTotal={expectedTotal}
          actualTotal={actualTotal}
          allScoresEntered={allScoresEntered}
        />

        <div className="space-y-2 pt-4">
          {isFromSession ? (
            <Button variant="primary" fullWidth onClick={onFinish}>
              Finish Game
            </Button>
          ) : (
            <>
              <Button variant="primary" fullWidth onClick={onBack}>
                Done
              </Button>
              <Button variant="secondary" fullWidth onClick={onEditPairings}>
                Edit Pairings
              </Button>
            </>
          )}
        </div>
      </div>

      <ScorePickerPopover
        isOpen={activePairingIndex !== null}
        value={activePairing?.actualScore ?? 10}
        ourFaction={activePairing?.ourPlayer.faction}
        oppFaction={activePairing?.oppPlayer.faction}
        onSelect={handleScoreSelect}
        onClose={() => setActivePairingIndex(null)}
      />
    </Layout>
  );
}

export function GameSummaryPage() {
  const { id: gameId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    pairings: sessionPairings,
    gameId: sessionGameId,
    reset: resetPairingStore,
    initializeFromGame,
    undoLastPairing,
    setPhase,
  } = usePairingStore();

  const { getGame, completeGame, updateActualScore } = useGameStore();
  const game = getGame(gameId);

  const isFromSession =
    sessionGameId === gameId && sessionPairings.length === (game?.ourTeam?.teamSize || 5);

  const pairings: Pairing[] = isFromSession ? sessionPairings : game?.pairings || [];

  const handleFinish = () => {
    if (isFromSession) {
      completeGame(gameId, sessionPairings);
    }
    resetPairingStore();
    navigate('/');
  };

  const handleBack = () => {
    if (isFromSession) {
      undoLastPairing();
      setPhase('final-pairing');
      navigate(`/game/${gameId}/pairing/final-pairing`);
      return;
    }
    navigate('/');
  };

  const handleEditPairings = () => {
    initializeFromGame(gameId);
    navigate(`/game/${gameId}/matrix`);
  };

  const handleScoreSelect = (index: number, score: number) => {
    updateActualScore(gameId, index, score);
  };

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
            <Button variant="primary" onClick={() => navigate(`/game/${gameId}/matrix`)}>
              Start Pairing
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <GameSummaryContent
      game={game}
      pairings={pairings}
      isFromSession={isFromSession}
      onBack={handleBack}
      onFinish={handleFinish}
      onEditPairings={handleEditPairings}
      onScoreSelect={handleScoreSelect}
    />
  );
}

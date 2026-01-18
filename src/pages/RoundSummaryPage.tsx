import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { MatchupPreview } from '@/components/Display/MatchupPreview';
import { RoundIndicator } from '@/components/Display/RoundIndicator';
import { ScoreInput } from '@/components/Inputs/ScoreInput';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { usePairingStore } from '@/store/pairingStore';
import { useTournamentStore } from '@/store/tournamentStore';
import { calculateRoundTotals } from '@/utils/scoring';
import type { Pairing } from '@/store/types';

export function RoundSummaryPage() {
  const { id, roundIndex: roundIndexParam } = useParams<{
    id: string;
    roundIndex: string;
  }>();
  const navigate = useNavigate();
  const roundIndex = parseInt(roundIndexParam ?? '0', 10);

  // Pairing store - for fresh pairings from just-completed pairing flow
  const {
    pairings: sessionPairings,
    tournamentId: sessionTournamentId,
    roundIndex: sessionRoundIndex,
    reset: resetPairingStore,
  } = usePairingStore();

  // Tournament store
  const { getTournament, completeRound, updateActualScore } =
    useTournamentStore();
  const tournament = getTournament(id ?? '');
  const round = tournament?.rounds[roundIndex];

  // Use session pairings if we just completed pairing, otherwise load from tournament
  const isFromSession =
    sessionTournamentId === id &&
    sessionRoundIndex === roundIndex &&
    sessionPairings.length === 5;

  const pairings: Pairing[] = useMemo(() => {
    if (isFromSession) {
      return sessionPairings;
    }
    return round?.pairings ?? [];
  }, [isFromSession, sessionPairings, round?.pairings]);

  // Save pairings to tournament on mount if coming from session
  useEffect(() => {
    if (isFromSession && round && round.pairings.length === 0) {
      completeRound(id!, roundIndex, sessionPairings);
    }
  }, [
    isFromSession,
    round,
    id,
    roundIndex,
    sessionPairings,
    completeRound,
  ]);

  // Calculate totals
  const { expectedTotal, actualTotal, allScoresEntered } = useMemo(
    () => calculateRoundTotals(pairings),
    [pairings]
  );

  // Handlers
  const handleActualScoreChange = (pairingIndex: number, score: number) => {
    if (id) {
      updateActualScore(id, roundIndex, pairingIndex, score);
    }
  };

  const handleNextRound = () => {
    resetPairingStore();
    navigate(`/tournament/${id}/round/${roundIndex + 1}/setup`);
  };

  const handleFinishTournament = () => {
    resetPairingStore();
    navigate(`/tournament/${id}`);
  };

  const handleBack = () => {
    navigate(`/tournament/${id}`);
  };

  // Error states
  if (!tournament) {
    return (
      <Layout title="Round Summary" showBack onBack={() => navigate('/')}>
        <div className="p-4 text-center">
          <p className="text-gray-600">Tournament not found</p>
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
      <Layout title="Round Summary" showBack onBack={handleBack}>
        <div className="p-4 text-center">
          <p className="text-gray-600">No pairings found for this round</p>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() =>
                navigate(`/tournament/${id}/round/${roundIndex}/matrix`)
              }
            >
              Start Pairing
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const totalRounds = tournament.rounds.length;
  const isLastRound = roundIndex >= totalRounds - 1;
  const opponentName = round?.opponentTeamName ?? 'Opponent';

  return (
    <Layout title="Round Summary" showBack onBack={handleBack}>
      <div className="p-4 space-y-4">
        {/* Round indicator */}
        <RoundIndicator currentRound={roundIndex + 1} totalRounds={totalRounds} />

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
                  <ScoreInput
                    value={pairing.actualScore ?? 10}
                    onChange={(score) => handleActualScoreChange(index, score)}
                    size="sm"
                    showColorCoding
                    aria-label={`Actual score for ${pairing.ourPlayer.name} vs ${pairing.oppPlayer.name}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Score summary */}
        <Card className="p-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Round Score
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
          {isLastRound ? (
            <Button variant="primary" fullWidth onClick={handleFinishTournament}>
              Finish Tournament
            </Button>
          ) : (
            <Button variant="primary" fullWidth onClick={handleNextRound}>
              Next Round
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={handleBack}>
            View Tournament
          </Button>
        </div>
      </div>
    </Layout>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Plus, Home, Play } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { ScoreBadge } from '@/components/Display/ScoreBadge';
import { RoundAccordion } from '@/components/Display/RoundAccordion';
import { useTournamentStore } from '@/store/tournamentStore';
import { usePairingStore } from '@/store/pairingStore';
import { calculateTournamentTotals } from '@/utils/scoring';
import { exportTournamentToJson } from '@/utils/export';

export function TournamentSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  const { getTournament } = useTournamentStore();
  const { initializeFromTournament } = usePairingStore();
  const tournament = getTournament(id ?? '');

  // Calculate tournament totals
  const totals = useMemo(() => {
    if (!tournament) {
      return {
        expectedTotal: 0,
        actualTotal: null,
        allScoresEntered: false,
        roundsCompleted: 0,
      };
    }
    return calculateTournamentTotals(tournament.rounds);
  }, [tournament]);

  // Handlers
  const handleToggleRound = (roundIndex: number) => {
    setExpandedRound(expandedRound === roundIndex ? null : roundIndex);
  };

  const handleContinueTournament = () => {
    if (!tournament) return;

    // Find the next round to work on
    const currentRoundIndex = tournament.currentRoundIndex;
    const currentRound = tournament.rounds[currentRoundIndex];

    if (!currentRound) {
      // No rounds started yet - go to round setup
      navigate(`/tournament/${id}/round/0/setup`);
    } else if (currentRound.status === 'in_progress') {
      // Round in progress - initialize pairing and go to matrix
      initializeFromTournament(id!, currentRoundIndex);
      navigate(`/tournament/${id}/round/${currentRoundIndex}/matrix`);
    } else if (currentRound.status === 'completed') {
      // Current round completed - start next round
      const nextRoundIndex = currentRoundIndex + 1;
      navigate(`/tournament/${id}/round/${nextRoundIndex}/setup`);
    } else {
      // Not started - go to setup
      navigate(`/tournament/${id}/round/${currentRoundIndex}/setup`);
    }
  };

  const handleStartNewRound = () => {
    if (!tournament) return;
    const nextRoundIndex = tournament.rounds.length;
    navigate(`/tournament/${id}/round/${nextRoundIndex}/setup`);
  };

  const handleExport = () => {
    if (tournament) {
      exportTournamentToJson(tournament);
    }
  };

  const handleNewTournament = () => {
    navigate('/tournament/new');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleBack = () => {
    navigate('/');
  };

  // Error state
  if (!tournament) {
    return (
      <Layout title="Tournament" showBack onBack={handleBack}>
        <div className="p-4 text-center">
          <p className="text-gray-600">Tournament not found</p>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const hasRounds = tournament.rounds.length > 0;
  const allRoundsCompleted =
    hasRounds &&
    tournament.rounds.every((r) => r.status === 'completed');
  const hasInProgressRound = tournament.rounds.some(
    (r) => r.status === 'in_progress'
  );

  return (
    <Layout title={tournament.name} showBack onBack={handleBack}>
      <div className="p-4 space-y-4">
        {/* Tournament Stats */}
        <Card className="p-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Tournament Stats
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rounds Completed</span>
              <span className="font-semibold text-gray-900">
                {totals.roundsCompleted}
              </span>
            </div>
            {totals.roundsCompleted > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Expected Total</span>
                  <ScoreBadge score={totals.expectedTotal} size="md" />
                </div>
                {totals.actualTotal !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Actual Total</span>
                    <ScoreBadge score={totals.actualTotal} size="md" />
                  </div>
                )}
                {totals.actualTotal !== null && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Difference</span>
                    <span
                      className={`font-semibold ${
                        totals.actualTotal >= totals.expectedTotal
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {totals.actualTotal >= totals.expectedTotal ? '+' : ''}
                      {totals.actualTotal - totals.expectedTotal}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Team info */}
        <Card className="p-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
            Your Team
          </h2>
          <p className="font-semibold text-gray-900">
            {tournament.ourTeam.teamName}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {tournament.ourTeam.players.map((player) => (
              <span
                key={player.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
              >
                {player.name}
              </span>
            ))}
          </div>
        </Card>

        {/* Rounds list */}
        {hasRounds ? (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
              Rounds
            </h2>
            {tournament.rounds.map((round, index) => (
              <RoundAccordion
                key={index}
                round={round}
                roundIndex={index}
                isExpanded={expandedRound === index}
                onToggle={() => handleToggleRound(index)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-gray-500">No rounds started yet</p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={handleStartNewRound}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Round 1
              </Button>
            </div>
          </Card>
        )}

        {/* Action buttons */}
        <div className="space-y-2 pt-4">
          {!allRoundsCompleted && hasRounds && (
            <Button variant="primary" fullWidth onClick={handleContinueTournament}>
              <Play className="w-4 h-4 mr-2" />
              {hasInProgressRound ? 'Continue Round' : 'Start Next Round'}
            </Button>
          )}

          {allRoundsCompleted && (
            <Button variant="primary" fullWidth onClick={handleStartNewRound}>
              <Plus className="w-4 h-4 mr-2" />
              Add Another Round
            </Button>
          )}

          {totals.roundsCompleted > 0 && (
            <Button variant="secondary" fullWidth onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          )}

          <Button variant="secondary" fullWidth onClick={handleNewTournament}>
            <Plus className="w-4 h-4 mr-2" />
            New Tournament
          </Button>

          <Button variant="secondary" fullWidth onClick={handleGoHome}>
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
}

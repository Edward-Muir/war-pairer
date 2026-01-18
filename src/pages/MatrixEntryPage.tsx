import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '@/store/tournamentStore';
import { usePairingStore } from '@/store/pairingStore';
import { Layout } from '@/components/Layout';
import { MatrixGrid } from '@/components/Matrix/MatrixGrid';
import { RoundIndicator } from '@/components/Display/RoundIndicator';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';

export function MatrixEntryPage() {
  const { id, roundIndex } = useParams<{ id: string; roundIndex: string }>();
  const navigate = useNavigate();

  // Store hooks
  const { getTournament, updateRoundMatrix, setActiveTournament } = useTournamentStore();
  const { initializeFromTournament, setPhase } = usePairingStore();

  // Get tournament and round data
  const tournament = getTournament(id!);
  const roundIdx = parseInt(roundIndex!, 10);
  const round = tournament?.rounds[roundIdx];

  // Set active tournament on mount
  useEffect(() => {
    if (id) {
      setActiveTournament(id);
    }
  }, [id, setActiveTournament]);

  // Local matrix state (copy from store to allow editing)
  const [matrix, setMatrix] = useState<number[][]>(() => {
    if (round?.matrix?.length === 5) {
      return round.matrix.map(row => [...row]); // Deep copy
    }
    return Array(5).fill(null).map(() => Array(5).fill(10));
  });

  // Handlers
  const handleScoreChange = (ourIndex: number, oppIndex: number, score: number) => {
    setMatrix(prev => {
      const newMatrix = prev.map(row => [...row]);
      newMatrix[ourIndex][oppIndex] = score;
      return newMatrix;
    });
  };

  const handleAllTens = () => {
    setMatrix(Array(5).fill(null).map(() => Array(5).fill(10)));
  };

  const handleStartPairing = () => {
    // 1. Save matrix to tournament store (persist)
    updateRoundMatrix(id!, roundIdx, matrix);
    // 2. Initialize pairing session with updated matrix
    // Note: We need a small delay since store updates are synchronous but
    // the getTournament read in initializeFromTournament needs the updated value
    setTimeout(() => {
      initializeFromTournament(id!, roundIdx);
      setPhase('defender-1-select');
      // 3. Navigate to first pairing phase
      navigate(`/tournament/${id}/round/${roundIndex}/pairing/defender-1-select`);
    }, 0);
  };

  const handleBack = () => {
    // Save current matrix progress before going back
    updateRoundMatrix(id!, roundIdx, matrix);
    navigate(`/tournament/${id}/round/${roundIndex}/setup`);
  };

  // Guard: no tournament/round
  if (!tournament || !round) {
    return (
      <Layout title="Error" showBack onBack={() => navigate('/')}>
        <div className="p-4">
          <p className="text-gray-600">Tournament or round not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Enter Matchup Scores" showBack onBack={handleBack}>
      <div className="px-4">
        {/* Round indicator */}
        <RoundIndicator
          currentRound={roundIdx + 1}
          totalRounds={tournament.rounds.length}
        />

        {/* Instructions */}
        <Card className="mt-4">
          <p className="text-sm text-gray-600">
            Enter your expected score (0-20) for each matchup.
            10 = even match. Higher = better for you.
          </p>
        </Card>

        {/* Quick fill buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={handleAllTens}>
            Reset
          </Button>
        </div>
      </div>

      {/* Matrix grid */}
      <div className="px-4 mt-4">
        <MatrixGrid
          ourTeam={tournament.ourTeam.players}
          oppTeam={round.opponentPlayers}
          scores={matrix}
          onScoreChange={handleScoreChange}
        />
      </div>

      <div className="px-4">
        {/* Start pairing button */}
        <div className="mt-6 pb-4">
          <Button variant="primary" fullWidth onClick={handleStartPairing}>
            Start Pairing
          </Button>
        </div>
      </div>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { usePairingStore } from '@/store/pairingStore';
import { Layout } from '@/components/Layout';
import { MatrixGrid } from '@/components/Matrix/MatrixGrid';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';

export function MatrixEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Store hooks
  const { getGame, updateGameMatrix, setActiveGame } = useGameStore();
  const { initializeFromGame, setPhase } = usePairingStore();

  // Get game data
  const game = getGame(id!);

  // Set active game on mount
  useEffect(() => {
    if (id) {
      setActiveGame(id);
    }
  }, [id, setActiveGame]);

  // Local matrix state (copy from store to allow editing)
  const [matrix, setMatrix] = useState<number[][]>(() => {
    if (game?.matrix?.length === 5) {
      return game.matrix.map(row => [...row]); // Deep copy
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
    // 1. Save matrix to game store (persist)
    updateGameMatrix(id!, matrix);
    // 2. Initialize pairing session with updated matrix
    setTimeout(() => {
      initializeFromGame(id!);
      setPhase('defender-1-select');
      // 3. Navigate to first pairing phase
      navigate(`/game/${id}/pairing/defender-1-select`);
    }, 0);
  };

  const handleBack = () => {
    // Save current matrix progress before going back
    updateGameMatrix(id!, matrix);
    navigate('/');
  };

  // Guard: no game
  if (!game) {
    return (
      <Layout title="Error" showBack onBack={() => navigate('/')}>
        <div className="p-4">
          <p className="text-gray-600">Game not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Enter Matchup Scores"
      showBack
      onBack={handleBack}
      rightAction={
        <button
          onClick={handleBack}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Go home"
        >
          <Home className="h-5 w-5" />
        </button>
      }
    >
      <div className="px-4">
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
          ourTeam={game.ourTeam.players}
          oppTeam={game.opponentPlayers}
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

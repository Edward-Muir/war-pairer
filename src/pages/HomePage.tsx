import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { ConfirmationModal } from '@/components/Common/ConfirmationModal';
import { TeamCard } from '@/components/Cards/TeamCard';
import { GameCard } from '@/components/Cards/GameCard';
import { useTeamStore } from '@/store/teamStore';
import { useGameStore } from '@/store/gameStore';
import { usePairingStore } from '@/store/pairingStore';

export function HomePage() {
  const navigate = useNavigate();
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);
  const { teams, deleteTeam } = useTeamStore();
  const { games, deleteGame } = useGameStore();
  const { gameId, phase } = usePairingStore();

  // Check for incomplete pairing session
  const hasIncompletePairing =
    gameId !== null &&
    phase !== 'home' &&
    phase !== 'game-summary';

  // Sort teams by most recently updated
  const sortedTeams = [...teams].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Sort games: in-progress first, then by creation date descending
  const sortedGames = [...games].sort((a, b) => {
    const aCompleted = a.status === 'completed';
    const bCompleted = b.status === 'completed';
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleResumePairing = () => {
    if (gameId) {
      if (phase === 'matrix-entry') {
        navigate(`/game/${gameId}/matrix`);
      } else {
        navigate(`/game/${gameId}/pairing/${phase}`);
      }
    }
  };

  const handleEditTeam = (teamId: string) => {
    navigate(`/team/${teamId}/edit`);
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeamToDelete(teamId);
  };

  const handleConfirmDeleteTeam = () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete);
      setTeamToDelete(null);
    }
  };

  const handleViewGame = (clickedGameId: string) => {
    // If this game has an active pairing session, resume it
    if (clickedGameId === gameId && hasIncompletePairing) {
      handleResumePairing();
      return;
    }
    // Non-completed games go to matrix, completed go to summary
    const game = games.find((g) => g.id === clickedGameId);
    if (game && game.status !== 'completed') {
      navigate(`/game/${clickedGameId}/matrix`);
      return;
    }
    navigate(`/game/${clickedGameId}/summary`);
  };

  const handleDeleteGame = (gameId: string) => {
    setGameToDelete(gameId);
  };

  const handleConfirmDeleteGame = () => {
    if (gameToDelete) {
      deleteGame(gameToDelete);
      setGameToDelete(null);
    }
  };

  return (
    <Layout title="UKTC Pairing">
      <div className="flex flex-col gap-6 p-4">
        {/* Resume Pairing Banner */}
        {hasIncompletePairing && (
          <Card className="border-blue-200 bg-blue-50">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-blue-900">Pairing in Progress</h3>
                <p className="text-sm text-blue-700">
                  You have an incomplete pairing session. Would you like to continue?
                </p>
              </div>
              <Button variant="primary" onClick={handleResumePairing}>
                Resume Pairing
              </Button>
            </div>
          </Card>
        )}

        {/* My Teams Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Teams</h2>
            <Button variant="secondary" size="sm" onClick={() => navigate('/team/new')}>
              Create Team
            </Button>
          </div>

          {sortedTeams.length === 0 ? (
            <Card>
              <div className="py-4 text-center text-gray-500">
                <p>No teams yet.</p>
                <p className="text-sm">Create a team to get started.</p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onEdit={() => handleEditTeam(team.id)}
                  onDelete={() => handleDeleteTeam(team.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Games Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Games</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/game/new')}
              disabled={teams.length === 0}
            >
              New Game
            </Button>
          </div>

          {sortedGames.length === 0 ? (
            <Card>
              <div className="py-4 text-center text-gray-500">
                <p>No games yet.</p>
                <p className="text-sm">
                  {teams.length === 0
                    ? 'Create a team first to start a game.'
                    : 'Start a new game to begin pairing.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onDelete={() => handleDeleteGame(game.id)}
                  onClick={() => handleViewGame(game.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Delete Team Confirmation */}
      <ConfirmationModal
        isOpen={teamToDelete !== null}
        onClose={() => setTeamToDelete(null)}
        onConfirm={handleConfirmDeleteTeam}
        title="Delete Team?"
        message="This will permanently delete the team and all its player data. This action cannot be undone."
        confirmText="Delete Team"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Game Confirmation */}
      <ConfirmationModal
        isOpen={gameToDelete !== null}
        onClose={() => setGameToDelete(null)}
        onConfirm={handleConfirmDeleteGame}
        title="Delete Game?"
        message="This will permanently delete this game and all its pairing data. This action cannot be undone."
        confirmText="Delete Game"
        cancelText="Cancel"
        variant="danger"
      />
    </Layout>
  );
}

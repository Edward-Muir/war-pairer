import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { ConfirmationModal } from '@/components/Common/ConfirmationModal';
import { TeamCard } from '@/components/Cards/TeamCard';
import { TournamentCard } from '@/components/Cards/TournamentCard';
import { useTeamStore } from '@/store/teamStore';
import { useTournamentStore } from '@/store/tournamentStore';
import { usePairingStore } from '@/store/pairingStore';

export function HomePage() {
  const navigate = useNavigate();
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [tournamentToDelete, setTournamentToDelete] = useState<string | null>(null);
  const { teams, deleteTeam } = useTeamStore();
  const { tournaments, deleteTournament, setActiveTournament } = useTournamentStore();
  const { tournamentId, roundIndex, phase } = usePairingStore();

  // Check for incomplete pairing session
  const hasIncompletePairing =
    tournamentId !== null &&
    roundIndex !== null &&
    phase !== 'home' &&
    phase !== 'round-summary' &&
    phase !== 'tournament-summary';

  // Sort teams by most recently updated
  const sortedTeams = [...teams].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Sort tournaments: active first, then by creation date
  const sortedTournaments = [...tournaments].sort((a, b) => {
    const aCompleted = a.rounds.length > 0 && a.rounds.every((r) => r.status === 'completed');
    const bCompleted = b.rounds.length > 0 && b.rounds.every((r) => r.status === 'completed');
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleResumePairing = () => {
    if (tournamentId && roundIndex !== null) {
      navigate(`/tournament/${tournamentId}/round/${roundIndex}/pairing/${phase}`);
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

  const handleContinueTournament = (tournament: (typeof tournaments)[0]) => {
    setActiveTournament(tournament.id);
    const currentRound = tournament.rounds[tournament.currentRoundIndex];
    if (!currentRound || currentRound.status === 'not_started') {
      navigate(`/tournament/${tournament.id}/round/${tournament.currentRoundIndex}/setup`);
    } else if (currentRound.status === 'in_progress') {
      navigate(`/tournament/${tournament.id}/round/${tournament.currentRoundIndex}/matrix`);
    } else {
      navigate(`/tournament/${tournament.id}`);
    }
  };

  const handleDeleteTournament = (tournamentId: string) => {
    setTournamentToDelete(tournamentId);
  };

  const handleConfirmDeleteTournament = () => {
    if (tournamentToDelete) {
      deleteTournament(tournamentToDelete);
      setTournamentToDelete(null);
    }
  };

  const handleViewTournament = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`);
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

        {/* Tournaments Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tournaments</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/tournament/new')}
              disabled={teams.length === 0}
            >
              New Tournament
            </Button>
          </div>

          {sortedTournaments.length === 0 ? (
            <Card>
              <div className="py-4 text-center text-gray-500">
                <p>No tournaments yet.</p>
                <p className="text-sm">
                  {teams.length === 0
                    ? 'Create a team first to start a tournament.'
                    : 'Start a new tournament to begin pairing.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onContinue={() => handleContinueTournament(tournament)}
                  onDelete={() => handleDeleteTournament(tournament.id)}
                  onClick={() => handleViewTournament(tournament.id)}
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

      {/* Delete Tournament Confirmation */}
      <ConfirmationModal
        isOpen={tournamentToDelete !== null}
        onClose={() => setTournamentToDelete(null)}
        onConfirm={handleConfirmDeleteTournament}
        title="Delete Tournament?"
        message="This will permanently delete the tournament and all round data. This action cannot be undone."
        confirmText="Delete Tournament"
        cancelText="Cancel"
        variant="danger"
      />
    </Layout>
  );
}

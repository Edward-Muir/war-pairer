import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { Select } from '@/components/Common/Select';
import { useTeamStore } from '@/store/teamStore';
import { useTournamentStore } from '@/store/tournamentStore';

export function TournamentSetupPage() {
  const navigate = useNavigate();
  const { teams } = useTeamStore();
  const { createTournament } = useTournamentStore();

  const [tournamentName, setTournamentName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Find selected team for preview
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Build team options for select
  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.teamName,
  }));

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!tournamentName.trim()) {
      newErrors.tournamentName = 'Tournament name is required';
    }

    if (!selectedTeamId) {
      newErrors.team = 'Please select a team';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStart = () => {
    if (!validate()) return;

    const tournament = createTournament({
      name: tournamentName.trim(),
      teamId: selectedTeamId,
    });

    if (tournament) {
      navigate(`/tournament/${tournament.id}/round/0/setup`);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  // If no teams exist, show message
  if (teams.length === 0) {
    return (
      <Layout title="New Tournament" showBack onBack={handleCancel}>
        <div className="flex flex-col gap-6 p-4">
          <Card>
            <div className="py-8 text-center">
              <h3 className="mb-2 font-semibold text-gray-900">No Teams Available</h3>
              <p className="mb-4 text-gray-600">
                You need to create a team before starting a tournament.
              </p>
              <Button variant="primary" onClick={() => navigate('/team/new')}>
                Create Team
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="New Tournament" showBack onBack={handleCancel}>
      <div className="flex flex-col gap-6 p-4">
        {/* Tournament Name Input */}
        <div>
          <label
            htmlFor="tournament-name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Tournament Name
          </label>
          <input
            type="text"
            id="tournament-name"
            value={tournamentName}
            onChange={(e) => {
              setTournamentName(e.target.value);
              if (errors.tournamentName) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.tournamentName;
                  return next;
                });
              }
            }}
            placeholder="e.g., London GT January 2026"
            className={`
              w-full min-h-[44px] px-4 py-2
              bg-white border rounded-lg
              text-base text-gray-900
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errors.tournamentName ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.tournamentName && (
            <p className="mt-1 text-sm text-red-600">{errors.tournamentName}</p>
          )}
        </div>

        {/* Team Selector */}
        <div>
          <Select
            label="Select Your Team"
            options={teamOptions}
            value={selectedTeamId}
            onChange={(value) => {
              setSelectedTeamId(value);
              if (errors.team) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.team;
                  return next;
                });
              }
            }}
            placeholder="Choose a team..."
          />
          {errors.team && (
            <p className="mt-1 text-sm text-red-600">{errors.team}</p>
          )}
        </div>

        {/* Selected Team Preview */}
        {selectedTeam && (
          <Card>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Team Preview</h3>
              <div className="grid gap-2">
                {selectedTeam.players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{player.name}</span>
                    {player.faction && (
                      <span className="text-gray-500">- {player.faction}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Action Button */}
        <Button variant="primary" fullWidth onClick={handleStart}>
          Start Tournament
        </Button>
      </div>
    </Layout>
  );
}

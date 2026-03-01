import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerInput } from '@/components/Inputs/PlayerInput';
import { useTeamStore, createDefaultPlayers } from '@/store/teamStore';
import { validateUniqueFactions, getOtherSelectedFactions } from '@/utils';
import type { Player, TeamSize } from '@/store/types';

export function TeamSetupPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getTeam, createTeam, updateTeam } = useTeamStore();

  const isEditMode = Boolean(id);
  const existingTeam = id ? getTeam(id) : undefined;

  const [teamSize, setTeamSize] = useState<TeamSize>(existingTeam?.teamSize ?? 5);
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form state
  useEffect(() => {
    if (isEditMode && existingTeam) {
      setTeamName(existingTeam.teamName);
      setPlayers([...existingTeam.players]);
    } else if (!isEditMode) {
      setTeamName('');
      setPlayers(createDefaultPlayers(5));
    }
  }, [id, isEditMode, existingTeam]);

  const handlePlayerNameChange = (index: number, name: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, name } : p)));
    // Clear error when user starts typing
    if (errors[`player-${index}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`player-${index}`];
        return next;
      });
    }
  };

  const handlePlayerFactionChange = (index: number, faction: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, faction } : p)));
    // Clear faction error when user changes selection
    if (errors[`faction-${index}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`faction-${index}`];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!teamName.trim()) {
      newErrors.teamName = 'Team name is required';
    }

    players.forEach((player, index) => {
      if (!player.name.trim()) {
        newErrors[`player-${index}`] = 'Player name is required';
      }
    });

    // Validate unique factions
    const factionValidation = validateUniqueFactions(players);
    if (!factionValidation.isValid) {
      Object.entries(factionValidation.errors).forEach(([key, value]) => {
        newErrors[key] = value;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (isEditMode && id) {
      updateTeam(id, {
        teamName: teamName.trim(),
        players,
      });
    } else {
      createTeam({
        teamName: teamName.trim(),
        teamSize,
        players,
      });
    }

    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <Layout title={isEditMode ? 'Edit Team' : 'Create Team'} showBack onBack={handleCancel}>
      <div className="flex flex-col gap-6 p-4">
        {/* Team Name Input */}
        <div>
          <label htmlFor="team-name" className="mb-1 block text-sm font-medium text-gray-700">
            Team Name
          </label>
          <input
            type="text"
            id="team-name"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              if (errors.teamName) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.teamName;
                  return next;
                });
              }
            }}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., Brighton Warhogs"
            className={`
              w-full min-h-[44px] px-4 py-2
              bg-white border rounded-lg
              text-base text-gray-900
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errors.teamName ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.teamName && <p className="mt-1 text-sm text-red-600">{errors.teamName}</p>}
        </div>

        {/* Team Size Selector */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Team Format</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 min-h-[44px] rounded-lg border text-sm font-medium transition-colors ${
                teamSize === 5
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => {
                setTeamSize(5);
                setPlayers(createDefaultPlayers(5));
              }}
              disabled={isEditMode}
            >
              5 Players (UKTC)
            </button>
            <button
              type="button"
              className={`flex-1 min-h-[44px] rounded-lg border text-sm font-medium transition-colors ${
                teamSize === 8
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => {
                setTeamSize(8);
                setPlayers(createDefaultPlayers(8));
              }}
              disabled={isEditMode}
            >
              8 Players (WTC)
            </button>
          </div>
        </div>

        {/* Players Section */}
        <Card>
          <div className="flex flex-col gap-4">
            <h3 className="font-medium text-gray-900">Players</h3>
            {players.map((player, index) => (
              <PlayerInput
                key={player.id}
                index={index}
                name={player.name}
                faction={player.faction}
                onNameChange={(name) => handlePlayerNameChange(index, name)}
                onFactionChange={(faction) => handlePlayerFactionChange(index, faction)}
                error={errors[`player-${index}`]}
                factionError={errors[`faction-${index}`]}
                excludedFactions={getOtherSelectedFactions(players, index)}
              />
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button variant="primary" fullWidth onClick={handleSave}>
            {isEditMode ? 'Save Changes' : 'Create Team'}
          </Button>
          {isEditMode && (
            <Button variant="secondary" fullWidth onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}

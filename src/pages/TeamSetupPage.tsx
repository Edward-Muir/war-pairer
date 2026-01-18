import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerInput } from '@/components/Inputs/PlayerInput';
import { useTeamStore, createDefaultPlayers } from '@/store/teamStore';
import { validateUniqueFactions, getOtherSelectedFactions } from '@/utils';
import type { Player } from '@/store/types';

export function TeamSetupPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getTeam, createTeam, updateTeam } = useTeamStore();

  const isEditMode = Boolean(id);
  const existingTeam = id ? getTeam(id) : undefined;

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
      setPlayers(createDefaultPlayers());
    }
  }, [id, isEditMode, existingTeam]);

  const handlePlayerNameChange = (index: number, name: string) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, name } : p))
    );
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
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, faction } : p))
    );
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

    const playersTuple = players as [Player, Player, Player, Player, Player];

    if (isEditMode && id) {
      updateTeam(id, {
        teamName: teamName.trim(),
        players: playersTuple,
      });
    } else {
      createTeam({
        teamName: teamName.trim(),
        players: playersTuple,
      });
    }

    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <Layout
      title={isEditMode ? 'Edit Team' : 'Create Team'}
      showBack
      onBack={handleCancel}
    >
      <div className="flex flex-col gap-6 p-4">
        {/* Team Name Input */}
        <div>
          <label
            htmlFor="team-name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
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
          {errors.teamName && (
            <p className="mt-1 text-sm text-red-600">{errors.teamName}</p>
          )}
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

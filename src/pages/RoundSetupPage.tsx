import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Common/Button';
import { Card } from '@/components/Common/Card';
import { PlayerInput } from '@/components/Inputs/PlayerInput';
import { RoundIndicator } from '@/components/Display/RoundIndicator';
import { useTournamentStore } from '@/store/tournamentStore';
import { createDefaultPlayers } from '@/store/teamStore';
import { validateUniqueFactions, getOtherSelectedFactions } from '@/utils';
import type { Player } from '@/store/types';

export function RoundSetupPage() {
  const navigate = useNavigate();
  const { id, roundIndex: roundIndexParam } = useParams<{ id: string; roundIndex: string }>();
  const { getTournament, startRound, setActiveTournament } = useTournamentStore();

  const roundIndex = parseInt(roundIndexParam ?? '0', 10);
  const tournament = id ? getTournament(id) : undefined;

  const [opponentTeamName, setOpponentTeamName] = useState('');
  const [opponentPlayers, setOpponentPlayers] = useState<Player[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOurTeam, setShowOurTeam] = useState(false);

  // Set active tournament on mount
  useEffect(() => {
    if (id) {
      setActiveTournament(id);
    }
  }, [id, setActiveTournament]);

  // Initialize opponent players
  useEffect(() => {
    // Check if this round already has data (editing existing round)
    const existingRound = tournament?.rounds[roundIndex];
    if (existingRound && existingRound.opponentPlayers.length > 0) {
      setOpponentTeamName(existingRound.opponentTeamName);
      setOpponentPlayers([...existingRound.opponentPlayers]);
    } else {
      setOpponentPlayers(createDefaultPlayers().map((p, i) => ({
        ...p,
        name: `Opponent ${i + 1}`,
      })));
    }
  }, [tournament, roundIndex]);

  if (!tournament) {
    return (
      <Layout title="Round Setup" showBack onBack={() => navigate('/')}>
        <div className="p-4">
          <Card>
            <div className="py-8 text-center">
              <p className="text-gray-600">Tournament not found.</p>
              <div className="mt-4">
                <Button variant="primary" onClick={() => navigate('/')}>
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    setOpponentPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, name } : p))
    );
    if (errors[`player-${index}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`player-${index}`];
        return next;
      });
    }
  };

  const handlePlayerFactionChange = (index: number, faction: string) => {
    setOpponentPlayers((prev) =>
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

    if (!opponentTeamName.trim()) {
      newErrors.opponentTeamName = 'Opponent team name is required';
    }

    opponentPlayers.forEach((player, index) => {
      if (!player.name.trim()) {
        newErrors[`player-${index}`] = 'Player name is required';
      }
    });

    // Validate unique factions for opponent team
    const factionValidation = validateUniqueFactions(opponentPlayers);
    if (!factionValidation.isValid) {
      Object.entries(factionValidation.errors).forEach(([key, value]) => {
        newErrors[key] = value;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    // Start the round with opponent data
    startRound({
      opponentTeamName: opponentTeamName.trim(),
      opponentPlayers: opponentPlayers.map((p) => ({
        ...p,
        name: p.name.trim(),
      })),
    });

    // Navigate to matrix entry
    navigate(`/tournament/${id}/round/${roundIndex}/matrix`);
  };

  const handleBack = () => {
    if (roundIndex === 0) {
      navigate('/');
    } else {
      navigate(`/tournament/${id}`);
    }
  };

  // Calculate total rounds - if no rounds yet, assume at least 5
  const totalRounds = Math.max(tournament.rounds.length, 5);

  return (
    <Layout
      title="Round Setup"
      showBack
      onBack={handleBack}
    >
      <div className="flex flex-col gap-6 p-4">
        {/* Round Indicator */}
        <RoundIndicator
          currentRound={roundIndex + 1}
          totalRounds={totalRounds}
          showProgress
        />

        {/* Our Team (Collapsible) */}
        <Card>
          <button
            type="button"
            onClick={() => setShowOurTeam(!showOurTeam)}
            className="flex w-full items-center justify-between min-h-[44px]"
            aria-expanded={showOurTeam}
          >
            <h3 className="font-medium text-gray-900">
              Our Team: {tournament.ourTeam.teamName}
            </h3>
            {showOurTeam ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {showOurTeam && (
            <div className="mt-3 grid gap-2 border-t pt-3">
              {tournament.ourTeam.players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{player.name}</span>
                  {player.faction && (
                    <span className="text-gray-500">- {player.faction}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Opponent Team Name */}
        <div>
          <label
            htmlFor="opponent-team-name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Opponent Team Name
          </label>
          <input
            type="text"
            id="opponent-team-name"
            value={opponentTeamName}
            onChange={(e) => {
              setOpponentTeamName(e.target.value);
              if (errors.opponentTeamName) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.opponentTeamName;
                  return next;
                });
              }
            }}
            placeholder="e.g., Team Fierce"
            className={`
              w-full min-h-[44px] px-4 py-2
              bg-white border rounded-lg
              text-base text-gray-900
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errors.opponentTeamName ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.opponentTeamName && (
            <p className="mt-1 text-sm text-red-600">{errors.opponentTeamName}</p>
          )}
        </div>

        {/* Opponent Players */}
        <Card>
          <div className="flex flex-col gap-4">
            <h3 className="font-medium text-gray-900">Opponent Players</h3>
            {opponentPlayers.map((player, index) => (
              <PlayerInput
                key={player.id}
                index={index}
                name={player.name}
                faction={player.faction}
                onNameChange={(name) => handlePlayerNameChange(index, name)}
                onFactionChange={(faction) => handlePlayerFactionChange(index, faction)}
                error={errors[`player-${index}`]}
                factionError={errors[`faction-${index}`]}
                excludedFactions={getOtherSelectedFactions(opponentPlayers, index)}
              />
            ))}
          </div>
        </Card>

        {/* Continue Button */}
        <Button variant="primary" fullWidth onClick={handleContinue}>
          Continue to Matrix
        </Button>
      </div>
    </Layout>
  );
}

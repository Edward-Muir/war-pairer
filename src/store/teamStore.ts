import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Team, Player, CreateTeamInput, UpdateTeamInput, TeamSize } from './types';

interface TeamState {
  teams: Team[];
}

interface TeamActions {
  createTeam: (input: CreateTeamInput) => Team;
  updateTeam: (id: string, updates: UpdateTeamInput) => void;
  deleteTeam: (id: string) => void;
  getTeam: (id: string) => Team | undefined;
}

type TeamStore = TeamState & TeamActions;

/**
 * Creates default players for a new team
 */
export const createDefaultPlayers = (teamSize: TeamSize = 5): Player[] => {
  return Array.from({ length: teamSize }, (_, index) => ({
    id: crypto.randomUUID(),
    index,
    name: '',
    faction: '',
  }));
};

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      // State
      teams: [],

      // Actions
      createTeam: (input) => {
        const now = new Date().toISOString();
        const newTeam: Team = {
          id: crypto.randomUUID(),
          teamName: input.teamName,
          teamSize: input.teamSize,
          players: input.players,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ teams: [...state.teams, newTeam] }));
        return newTeam;
      },

      updateTeam: (id, updates) => {
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === id ? { ...team, ...updates, updatedAt: new Date().toISOString() } : team
          ),
        }));
      },

      deleteTeam: (id) => {
        set((state) => ({
          teams: state.teams.filter((team) => team.id !== id),
        }));
      },

      getTeam: (id) => {
        return get().teams.find((team) => team.id === id);
      },
    }),
    {
      name: 'uktc-teams',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const state = persisted as { teams: Team[] };
          state.teams = state.teams.map((t) => ({
            ...t,
            teamSize: (t.teamSize ?? 5) as TeamSize,
          }));
        }
        return persisted as TeamState & TeamActions;
      },
    }
  )
);

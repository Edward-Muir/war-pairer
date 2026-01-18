import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Tournament,
  TournamentRound,
  CreateTournamentInput,
  CreateRoundInput,
  Pairing,
} from './types';
import { useTeamStore } from './teamStore';

interface TournamentState {
  tournaments: Tournament[];
  activeTournamentId: string | null;
}

interface TournamentActions {
  createTournament: (input: CreateTournamentInput) => Tournament | null;
  setActiveTournament: (id: string | null) => void;
  getActiveTournament: () => Tournament | undefined;
  getTournament: (id: string) => Tournament | undefined;
  deleteTournament: (id: string) => void;

  // Round management
  startRound: (input: CreateRoundInput) => void;
  updateRoundMatrix: (tournamentId: string, roundIndex: number, matrix: number[][]) => void;
  completeRound: (tournamentId: string, roundIndex: number, pairings: Pairing[]) => void;
  advanceToNextRound: (tournamentId: string) => void;
}

type TournamentStore = TournamentState & TournamentActions;

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      // State
      tournaments: [],
      activeTournamentId: null,

      // Actions
      createTournament: (input) => {
        // Look up the team from teamStore
        const team = useTeamStore.getState().getTeam(input.teamId);
        if (!team) {
          console.error(`Team with id ${input.teamId} not found`);
          return null;
        }

        const newTournament: Tournament = {
          id: crypto.randomUUID(),
          name: input.name,
          ourTeam: { ...team }, // Snapshot copy
          rounds: [],
          currentRoundIndex: 0,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          tournaments: [...state.tournaments, newTournament],
          activeTournamentId: newTournament.id,
        }));

        return newTournament;
      },

      setActiveTournament: (id) => {
        set({ activeTournamentId: id });
      },

      getActiveTournament: () => {
        const { tournaments, activeTournamentId } = get();
        return tournaments.find((t) => t.id === activeTournamentId);
      },

      getTournament: (id) => {
        return get().tournaments.find((t) => t.id === id);
      },

      deleteTournament: (id) => {
        set((state) => ({
          tournaments: state.tournaments.filter((t) => t.id !== id),
          activeTournamentId:
            state.activeTournamentId === id ? null : state.activeTournamentId,
        }));
      },

      startRound: (input) => {
        const { activeTournamentId, tournaments } = get();
        if (!activeTournamentId) return;

        const tournament = tournaments.find((t) => t.id === activeTournamentId);
        if (!tournament) return;

        const newRound: TournamentRound = {
          roundNumber: tournament.rounds.length + 1,
          opponentTeamName: input.opponentTeamName,
          opponentPlayers: input.opponentPlayers,
          matrix: Array(5).fill(null).map(() => Array(5).fill(10)), // Default 10s
          pairings: [],
          status: 'in_progress',
        };

        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === activeTournamentId
              ? {
                  ...t,
                  rounds: [...t.rounds, newRound],
                  currentRoundIndex: t.rounds.length,
                }
              : t
          ),
        }));
      },

      updateRoundMatrix: (tournamentId, roundIndex, matrix) => {
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  rounds: t.rounds.map((r, i) =>
                    i === roundIndex ? { ...r, matrix } : r
                  ),
                }
              : t
          ),
        }));
      },

      completeRound: (tournamentId, roundIndex, pairings) => {
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  rounds: t.rounds.map((r, i) =>
                    i === roundIndex
                      ? { ...r, pairings, status: 'completed' as const }
                      : r
                  ),
                }
              : t
          ),
        }));
      },

      advanceToNextRound: (tournamentId) => {
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? { ...t, currentRoundIndex: t.currentRoundIndex + 1 }
              : t
          ),
        }));
      },
    }),
    {
      name: 'uktc-tournaments',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Game, CreateGameInput, Pairing } from './types';
import { useTeamStore } from './teamStore';

interface GameState {
  games: Game[];
  activeGameId: string | null;
}

interface GameActions {
  createGame: (input: CreateGameInput) => Game | null;
  setActiveGame: (id: string | null) => void;
  getActiveGame: () => Game | undefined;
  getGame: (id: string) => Game | undefined;
  deleteGame: (id: string) => void;
  updateGameMatrix: (gameId: string, matrix: number[][]) => void;
  completeGame: (gameId: string, pairings: Pairing[]) => void;
  updateActualScore: (
    gameId: string,
    pairingIndex: number,
    actualScore: number
  ) => void;
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // State
      games: [],
      activeGameId: null,

      // Actions
      createGame: (input) => {
        const team = useTeamStore.getState().getTeam(input.teamId);
        if (!team) {
          console.error(`Team with id ${input.teamId} not found`);
          return null;
        }

        const newGame: Game = {
          id: crypto.randomUUID(),
          ourTeam: { ...team },
          opponentTeamName: input.opponentTeamName,
          opponentPlayers: input.opponentPlayers,
          matrix: Array(5).fill(null).map(() => Array(5).fill(10)),
          pairings: [],
          status: 'matrix',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          games: [...state.games, newGame],
          activeGameId: newGame.id,
        }));

        return newGame;
      },

      setActiveGame: (id) => {
        set({ activeGameId: id });
      },

      getActiveGame: () => {
        const { games, activeGameId } = get();
        return games.find((g) => g.id === activeGameId);
      },

      getGame: (id) => {
        return get().games.find((g) => g.id === id);
      },

      deleteGame: (id) => {
        set((state) => ({
          games: state.games.filter((g) => g.id !== id),
          activeGameId:
            state.activeGameId === id ? null : state.activeGameId,
        }));
      },

      updateGameMatrix: (gameId, matrix) => {
        set((state) => ({
          games: state.games.map((g) =>
            g.id === gameId ? { ...g, matrix } : g
          ),
        }));
      },

      completeGame: (gameId, pairings) => {
        set((state) => ({
          games: state.games.map((g) =>
            g.id === gameId
              ? { ...g, pairings, status: 'completed' as const }
              : g
          ),
        }));
      },

      updateActualScore: (gameId, pairingIndex, actualScore) => {
        set((state) => ({
          games: state.games.map((g) =>
            g.id === gameId
              ? {
                  ...g,
                  pairings: g.pairings.map((p, pi) =>
                    pi === pairingIndex ? { ...p, actualScore } : p
                  ),
                }
              : g
          ),
        }));
      },
    }),
    {
      name: 'uktc-games',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

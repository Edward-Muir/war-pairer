import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Phase, Player, Pairing, MatchupMatrix, RoundSelectionState, TeamSize } from './types';
import { getSelectionRoundCount, generatePhaseOrder } from './types';
import { useGameStore } from './gameStore';

interface PairingState {
  // Current pairing session context
  gameId: string | null;

  // Matrix data for current game
  matrix: MatchupMatrix | null;

  // Current phase
  phase: Phase;

  // Team size determines number of selection rounds
  teamSize: TeamSize;

  // Selection state for each pairing round (length = getSelectionRoundCount(teamSize))
  rounds: RoundSelectionState[];

  // Completed pairings
  pairings: Pairing[];

  // Remaining players after selections
  ourRemaining: Player[];
  oppRemaining: Player[];
}

interface PairingActions {
  // Initialization
  initializeFromGame: (gameId: string) => boolean;
  reset: () => void;

  // Phase transitions
  setPhase: (phase: Phase) => void;
  advancePhase: () => void;

  // Round selections (round is 1-indexed)
  setOurDefender: (round: number, player: Player) => void;
  setOppDefender: (round: number, player: Player) => void;
  setOurAttackers: (round: number, players: [Player, Player]) => void;
  setOppAttackers: (round: number, players: [Player, Player]) => void;
  getRound: (round: number) => RoundSelectionState;

  // Pairing actions
  lockPairing: (pairing: Pairing) => void;
  choosePairing: (ourPlayer: Player, oppPlayer: Player, round: number) => void;
  undoLastPairing: () => void;

  // Computed helpers
  getOurRemaining: () => Player[];
  getOppRemaining: () => Player[];
  getExpectedScore: (ourPlayerIndex: number, oppPlayerIndex: number) => number;
}

type PairingStore = PairingState & PairingActions;

const initialRoundState: RoundSelectionState = {
  ourDefender: null,
  oppDefender: null,
  ourAttackers: null,
  oppAttackers: null,
};

const initialState: PairingState = {
  gameId: null,
  matrix: null,
  phase: 'home',
  teamSize: 5,
  rounds: [{ ...initialRoundState }, { ...initialRoundState }],
  pairings: [],
  ourRemaining: [],
  oppRemaining: [],
};

// Helper to rebuild matrix and remaining players from game data
function rebuildFromGame(
  gameId: string | null,
  pairings: Pairing[]
): {
  matrix: MatchupMatrix | null;
  ourRemaining: Player[];
  oppRemaining: Player[];
  teamSize: TeamSize;
} {
  if (!gameId) {
    return { matrix: null, ourRemaining: [], oppRemaining: [], teamSize: 5 };
  }

  const game = useGameStore.getState().getGame(gameId);
  if (!game) {
    return { matrix: null, ourRemaining: [], oppRemaining: [], teamSize: 5 };
  }

  const teamSize: TeamSize = (game.ourTeam.teamSize ?? 5) as TeamSize;

  const matrix: MatchupMatrix = {
    ourTeam: [...game.ourTeam.players],
    oppTeam: [...game.opponentPlayers],
    scores: game.matrix,
  };

  // Remove already-paired players from remaining
  const pairedOurIds = new Set(pairings.map((p) => p.ourPlayer.id));
  const pairedOppIds = new Set(pairings.map((p) => p.oppPlayer.id));

  const ourRemaining = game.ourTeam.players.filter((p) => !pairedOurIds.has(p.id));
  const oppRemaining = game.opponentPlayers.filter((p) => !pairedOppIds.has(p.id));

  return { matrix, ourRemaining, oppRemaining, teamSize };
}

export const usePairingStore = create<PairingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      initializeFromGame: (gameId) => {
        const game = useGameStore.getState().getGame(gameId);
        if (!game) return false;

        const teamSize: TeamSize = (game.ourTeam.teamSize ?? 5) as TeamSize;
        const roundCount = getSelectionRoundCount(teamSize);

        const matrix: MatchupMatrix = {
          ourTeam: [...game.ourTeam.players],
          oppTeam: [...game.opponentPlayers],
          scores: game.matrix,
        };

        set({
          gameId,
          matrix,
          phase: 'matrix-entry',
          teamSize,
          rounds: Array.from({ length: roundCount }, () => ({ ...initialRoundState })),
          pairings: [],
          ourRemaining: [...game.ourTeam.players],
          oppRemaining: [...game.opponentPlayers],
        });

        return true;
      },

      reset: () => {
        set(initialState);
      },

      setPhase: (phase) => {
        set({ phase });
      },

      advancePhase: () => {
        const { phase, teamSize } = get();
        const order = generatePhaseOrder(teamSize);
        const currentIndex = order.indexOf(phase);
        if (currentIndex < order.length - 1) {
          set({ phase: order[currentIndex + 1] });
        }
      },

      // Generic round setters (round is 1-indexed)
      setOurDefender: (round, player) => {
        set((state) => {
          const rounds = [...state.rounds];
          rounds[round - 1] = { ...rounds[round - 1], ourDefender: player };
          return { rounds };
        });
      },

      setOppDefender: (round, player) => {
        set((state) => {
          const rounds = [...state.rounds];
          rounds[round - 1] = { ...rounds[round - 1], oppDefender: player };
          return { rounds };
        });
      },

      setOurAttackers: (round, players) => {
        set((state) => {
          const rounds = [...state.rounds];
          rounds[round - 1] = { ...rounds[round - 1], ourAttackers: players };
          return { rounds };
        });
      },

      setOppAttackers: (round, players) => {
        set((state) => {
          const rounds = [...state.rounds];
          rounds[round - 1] = { ...rounds[round - 1], oppAttackers: players };
          return { rounds };
        });
      },

      getRound: (round) => {
        return (
          get().rounds[round - 1] ?? {
            ourDefender: null,
            oppDefender: null,
            ourAttackers: null,
            oppAttackers: null,
          }
        );
      },

      // Pairing actions
      lockPairing: (pairing) => {
        set((state) => {
          const ourRemaining = state.ourRemaining.filter((p) => p.id !== pairing.ourPlayer.id);
          const oppRemaining = state.oppRemaining.filter((p) => p.id !== pairing.oppPlayer.id);
          return {
            pairings: [...state.pairings, pairing],
            ourRemaining,
            oppRemaining,
          };
        });
      },

      choosePairing: (ourPlayer, oppPlayer, round) => {
        const { matrix, lockPairing } = get();
        if (!matrix) return;

        const ourIndex = matrix.ourTeam.findIndex((p) => p.id === ourPlayer.id);
        const oppIndex = matrix.oppTeam.findIndex((p) => p.id === oppPlayer.id);
        const expectedScore = matrix.scores[ourIndex]?.[oppIndex] ?? 10;

        lockPairing({
          ourPlayer,
          oppPlayer,
          expectedScore,
          round,
        });
      },

      undoLastPairing: () => {
        set((state) => {
          if (state.pairings.length === 0) return state;
          const lastPairing = state.pairings[state.pairings.length - 1];
          return {
            pairings: state.pairings.slice(0, -1),
            ourRemaining: [...state.ourRemaining, lastPairing.ourPlayer],
            oppRemaining: [...state.oppRemaining, lastPairing.oppPlayer],
          };
        });
      },

      // Helpers
      getOurRemaining: () => get().ourRemaining,
      getOppRemaining: () => get().oppRemaining,

      getExpectedScore: (ourPlayerIndex, oppPlayerIndex) => {
        const { matrix } = get();
        return matrix?.scores[ourPlayerIndex]?.[oppPlayerIndex] ?? 10;
      },
    }),
    {
      name: 'uktc-current-pairing',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const old = persisted as Record<string, unknown>;
          return {
            ...old,
            teamSize: 5,
            rounds: [
              old.round1 ?? { ...initialRoundState },
              old.round2 ?? { ...initialRoundState },
            ],
          };
        }
        return persisted as PairingState & PairingActions;
      },
      // Only persist essential state, not derived values
      partialize: (state) => ({
        gameId: state.gameId,
        phase: state.phase,
        teamSize: state.teamSize,
        rounds: state.rounds,
        pairings: state.pairings,
      }),
      // Rebuild matrix and remaining players from game data after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { matrix, ourRemaining, oppRemaining, teamSize } = rebuildFromGame(
            state.gameId,
            state.pairings
          );
          state.matrix = matrix;
          state.ourRemaining = ourRemaining;
          state.oppRemaining = oppRemaining;
          state.teamSize = teamSize;
        }
      },
    }
  )
);

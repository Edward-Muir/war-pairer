import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Phase,
  Player,
  Pairing,
  MatchupMatrix,
  RoundSelectionState,
} from './types';
import { useTournamentStore } from './tournamentStore';

interface PairingState {
  // Current pairing session context
  tournamentId: string | null;
  roundIndex: number | null;

  // Matrix data for current round
  matrix: MatchupMatrix | null;

  // Current phase
  phase: Phase;

  // Selection state for pairing rounds 1 and 2
  round1: RoundSelectionState;
  round2: RoundSelectionState;

  // Completed pairings (up to 5)
  pairings: Pairing[];

  // Remaining players after selections
  ourRemaining: Player[];
  oppRemaining: Player[];
}

interface PairingActions {
  // Initialization
  initializeFromTournament: (tournamentId: string, roundIndex: number) => boolean;
  reset: () => void;

  // Phase transitions
  setPhase: (phase: Phase) => void;
  advancePhase: () => void;

  // Round 1 selections
  setOurDefender1: (player: Player) => void;
  setOppDefender1: (player: Player) => void;
  setOurAttackers1: (players: [Player, Player]) => void;
  setOppAttackers1: (players: [Player, Player]) => void;

  // Round 2 selections
  setOurDefender2: (player: Player) => void;
  setOppDefender2: (player: Player) => void;
  setOurAttackers2: (players: [Player, Player]) => void;
  setOppAttackers2: (players: [Player, Player]) => void;

  // Pairing actions
  lockPairing: (pairing: Pairing) => void;
  choosePairing: (ourPlayer: Player, oppPlayer: Player, round: 1 | 2 | 3) => void;

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
  tournamentId: null,
  roundIndex: null,
  matrix: null,
  phase: 'home',
  round1: { ...initialRoundState },
  round2: { ...initialRoundState },
  pairings: [],
  ourRemaining: [],
  oppRemaining: [],
};

// Phase transition map for advancePhase
const phaseOrder: Phase[] = [
  'home',
  'team-setup',
  'tournament-setup',
  'round-setup',
  'matrix-entry',
  'defender-1-select',
  'defender-1-reveal',
  'attacker-1-select',
  'attacker-1-reveal',
  'defender-1-choose',
  'defender-2-select',
  'defender-2-reveal',
  'attacker-2-select',
  'attacker-2-reveal',
  'defender-2-choose',
  'final-pairing',
  'round-summary',
  'tournament-summary',
];

export const usePairingStore = create<PairingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      initializeFromTournament: (tournamentId, roundIndex) => {
        const tournament = useTournamentStore.getState().getTournament(tournamentId);
        if (!tournament) return false;

        const round = tournament.rounds[roundIndex];
        if (!round) return false;

        const matrix: MatchupMatrix = {
          ourTeam: [...tournament.ourTeam.players],
          oppTeam: [...round.opponentPlayers],
          scores: round.matrix,
        };

        set({
          tournamentId,
          roundIndex,
          matrix,
          phase: 'matrix-entry',
          round1: { ...initialRoundState },
          round2: { ...initialRoundState },
          pairings: [],
          ourRemaining: [...tournament.ourTeam.players],
          oppRemaining: [...round.opponentPlayers],
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
        const { phase } = get();
        const currentIndex = phaseOrder.indexOf(phase);
        if (currentIndex < phaseOrder.length - 1) {
          set({ phase: phaseOrder[currentIndex + 1] });
        }
      },

      // Round 1 selections
      setOurDefender1: (player) => {
        set((state) => ({
          round1: { ...state.round1, ourDefender: player },
        }));
      },

      setOppDefender1: (player) => {
        set((state) => ({
          round1: { ...state.round1, oppDefender: player },
        }));
      },

      setOurAttackers1: (players) => {
        set((state) => ({
          round1: { ...state.round1, ourAttackers: players },
        }));
      },

      setOppAttackers1: (players) => {
        set((state) => ({
          round1: { ...state.round1, oppAttackers: players },
        }));
      },

      // Round 2 selections
      setOurDefender2: (player) => {
        set((state) => ({
          round2: { ...state.round2, ourDefender: player },
        }));
      },

      setOppDefender2: (player) => {
        set((state) => ({
          round2: { ...state.round2, oppDefender: player },
        }));
      },

      setOurAttackers2: (players) => {
        set((state) => ({
          round2: { ...state.round2, ourAttackers: players },
        }));
      },

      setOppAttackers2: (players) => {
        set((state) => ({
          round2: { ...state.round2, oppAttackers: players },
        }));
      },

      // Pairing actions
      lockPairing: (pairing) => {
        set((state) => {
          const ourRemaining = state.ourRemaining.filter(
            (p) => p.id !== pairing.ourPlayer.id
          );
          const oppRemaining = state.oppRemaining.filter(
            (p) => p.id !== pairing.oppPlayer.id
          );
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
      // Only persist essential state, not derived values
      partialize: (state) => ({
        tournamentId: state.tournamentId,
        roundIndex: state.roundIndex,
        phase: state.phase,
        round1: state.round1,
        round2: state.round2,
        pairings: state.pairings,
        // Note: matrix, ourRemaining, and oppRemaining will be rebuilt on rehydration
      }),
    }
  )
);

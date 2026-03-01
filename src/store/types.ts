// ============================================
// Core Entity Types
// ============================================

export type TeamSize = 5 | 8;

/**
 * A player/army in a team
 */
export interface Player {
  id: string; // UUID for stable identity
  index: number; // 0-based position in team
  name: string; // Display name, e.g., "Player 1" or "John"
  faction: string; // Faction/Army, e.g., "Space Marines"
}

/**
 * A persistent team of players
 */
export interface Team {
  id: string;
  teamName: string;
  teamSize: TeamSize;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

/**
 * A locked pairing between two players
 */
export interface Pairing {
  ourPlayer: Player;
  oppPlayer: Player;
  expectedScore: number; // From matrix
  actualScore?: number; // Post-game result
  round: number; // Which pairing round (not tournament round)
}

/**
 * The matchup matrix for scoring
 */
export interface MatchupMatrix {
  ourTeam: Player[]; // Our 5 players for this round
  oppTeam: Player[]; // Opponent's 5 players
  scores: number[][]; // scores[ourIndex][oppIndex] = expected score
}

// ============================================
// Game Types
// ============================================

export type GameStatus = 'setup' | 'matrix' | 'pairing' | 'completed';

/**
 * A standalone game (single pairing session against one opponent)
 */
export interface Game {
  id: string;
  ourTeam: Team; // Snapshot of team at game creation
  opponentTeamName: string;
  opponentPlayers: Player[];
  matrix: number[][]; // NxN scores (5x5 or 8x8)
  pairings: Pairing[]; // Filled after pairing completion
  status: GameStatus;
  createdAt: string;
}

// ============================================
// Pairing Session Types
// ============================================

/**
 * Selection state for a single pairing round (round 1 or 2)
 */
export interface RoundSelectionState {
  ourDefender: Player | null;
  oppDefender: Player | null;
  ourAttackers: [Player, Player] | null;
  oppAttackers: [Player, Player] | null;
}

/**
 * Phase of the pairing flow
 */
export type Phase =
  // Setup phases
  | 'home'
  | 'team-setup'
  | 'game-setup'
  | 'matrix-entry'
  // Dynamic pairing rounds
  | `defender-${number}-select`
  | `defender-${number}-reveal`
  | `attacker-${number}-select`
  | `attacker-${number}-reveal`
  | `defender-${number}-choose`
  // Completion
  | 'final-pairing'
  | 'game-summary';

// ============================================
// Utility Types
// ============================================

/**
 * Helper type to create a new team (without auto-generated fields)
 */
export type CreateTeamInput = {
  teamName: string;
  teamSize: TeamSize;
  players: Player[];
};

/**
 * Helper type to update a team
 */
export type UpdateTeamInput = Partial<Omit<Team, 'id' | 'createdAt'>>;

/**
 * Helper type to create a new game
 */
export type CreateGameInput = {
  teamId: string;
  opponentTeamName: string;
  opponentPlayers: Player[];
};

// ============================================
// Team Size Helper Functions
// ============================================

/** Number of selection rounds before final */
export function getSelectionRoundCount(size: TeamSize): number {
  return size === 5 ? 2 : 3;
}

/** Total pairings in a complete game */
export function getTotalPairings(size: TeamSize): number {
  return size;
}

/** Whether this is the final selection round */
export function isFinalSelectionRound(size: TeamSize, round: number): boolean {
  return round === getSelectionRoundCount(size);
}

/** Generate the ordered list of pairing phases */
export function generatePairingPhases(size: TeamSize): Phase[] {
  const rounds = getSelectionRoundCount(size);
  const phases: Phase[] = [];
  for (let r = 1; r <= rounds; r++) {
    phases.push(
      `defender-${r}-select` as Phase,
      `defender-${r}-reveal` as Phase,
      `attacker-${r}-select` as Phase,
      `attacker-${r}-reveal` as Phase,
      `defender-${r}-choose` as Phase
    );
  }
  phases.push('final-pairing');
  return phases;
}

/** Generate the full phase order including setup phases */
export function generatePhaseOrder(size: TeamSize): Phase[] {
  return [
    'home',
    'team-setup',
    'game-setup',
    'matrix-entry',
    ...generatePairingPhases(size),
    'game-summary',
  ];
}

/** Generate the previous-phase map for back navigation */
export function generatePreviousPhaseMap(
  size: TeamSize
): Record<string, Phase | 'confirm-abandon'> {
  const rounds = getSelectionRoundCount(size);
  const map: Record<string, Phase | 'confirm-abandon'> = {};
  for (let r = 1; r <= rounds; r++) {
    map[`defender-${r}-select`] =
      r === 1 ? 'confirm-abandon' : (`defender-${r - 1}-choose` as Phase);
    map[`defender-${r}-reveal`] = `defender-${r}-select` as Phase;
    map[`attacker-${r}-select`] = `defender-${r}-reveal` as Phase;
    map[`attacker-${r}-reveal`] = `attacker-${r}-select` as Phase;
    map[`defender-${r}-choose`] = `attacker-${r}-reveal` as Phase;
  }
  map['final-pairing'] = `defender-${rounds}-choose` as Phase;
  return map;
}

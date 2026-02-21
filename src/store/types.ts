// ============================================
// Core Entity Types
// ============================================

/**
 * A player/army in a team
 */
export interface Player {
  id: string;          // UUID for stable identity
  index: number;       // 0-4 position in team
  name: string;        // Display name, e.g., "Player 1" or "John"
  faction: string;     // Faction/Army, e.g., "Space Marines"
}

/**
 * A persistent team of 5 players
 */
export interface Team {
  id: string;
  teamName: string;
  players: [Player, Player, Player, Player, Player]; // Tuple for exactly 5
  createdAt: string;
  updatedAt: string;
}

/**
 * A locked pairing between two players
 */
export interface Pairing {
  ourPlayer: Player;
  oppPlayer: Player;
  expectedScore: number;    // From matrix
  actualScore?: number;     // Post-game result
  round: 1 | 2 | 3;         // Which pairing round (not tournament round)
}

/**
 * The matchup matrix for scoring
 */
export interface MatchupMatrix {
  ourTeam: Player[];        // Our 5 players for this round
  oppTeam: Player[];        // Opponent's 5 players
  scores: number[][];       // scores[ourIndex][oppIndex] = expected score
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
  ourTeam: Team;              // Snapshot of team at game creation
  opponentTeamName: string;
  opponentPlayers: Player[];
  matrix: number[][];         // 5x5 scores
  pairings: Pairing[];        // Filled after pairing completion
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
  // Pairing round 1
  | 'defender-1-select'
  | 'defender-1-reveal'
  | 'attacker-1-select'
  | 'attacker-1-reveal'
  | 'defender-1-choose'
  // Pairing round 2
  | 'defender-2-select'
  | 'defender-2-reveal'
  | 'attacker-2-select'
  | 'attacker-2-reveal'
  | 'defender-2-choose'
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
  players: [Player, Player, Player, Player, Player];
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

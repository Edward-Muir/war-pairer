# UKTC Pairing Optimizer App — Development Plan

## 1. Project Overview

### 1.1 Purpose
A mobile-first React application that guides Warhammer 40K team captains through the UKTC pairing process, providing optimal recommendations at each decision point based on game-theoretic analysis.

### 1.2 Core Features
- **Persistent Team Setup**: Enter your team composition once, reuse across all tournament rounds
- **Tournament Management**: Track multiple rounds against different opponents
- **Matrix Entry**: Input 5×5 matchup matrix (only opponent details change each round)
- **Phase Navigation**: Step through all pairing phases sequentially
- **Optimal Recommendations**: Calculate and display best choices with expected scores
- **Score Tracking**: Running tally of locked matchups and projected outcomes
- **Round History**: Review past pairings and results from earlier rounds
- **Undo/Edit**: Ability to go back and adjust previous selections

### 1.3 Tech Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 18 + Vite | Fast builds, modern React features |
| Language | TypeScript | Type safety for complex game logic |
| Styling | Tailwind CSS | Rapid mobile-responsive development |
| State | Zustand | Lightweight, no boilerplate, persist middleware |
| Routing | React Router v6 | Phase-based navigation |
| Deployment | Vercel | Zero-config React deployment |
| Testing | Vitest + React Testing Library | Unit tests for algorithms |

---

## 2. Data Structures

### 2.1 Core Types

```typescript
// Player/Army representation
interface Player {
  id: number;          // 0-4 index
  name: string;        // e.g., "Player 1" or custom name
  faction: string;     // e.g., "Space Marines"
}

// Persistent team (saved to localStorage)
interface Team {
  id: string;          // UUID for the team
  teamName: string;    // e.g., "Goonhammer GT Squad"
  players: Player[];   // Always 5 players
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
}

// Tournament tracking
interface Tournament {
  id: string;
  name: string;        // e.g., "London GT 2026"
  ourTeam: Team;
  rounds: TournamentRound[];
  currentRound: number;
  createdAt: string;
}

interface TournamentRound {
  roundNumber: number;
  opponentTeamName: string;
  opponentPlayers: Player[];
  matrix: number[][];  // Matchup scores for this round
  pairings: Pairing[]; // Final pairings (filled after completion)
  actualScores?: number[]; // Optional: real scores after games played
  status: 'not_started' | 'in_progress' | 'completed';
}

// The matchup matrix (per-round)
interface MatchupMatrix {
  ourTeam: Player[];   // Reference to persistent team
  oppTeam: Player[];   // This round's opponent
  scores: number[][];  // scores[ourIndex][oppIndex] = expected score
}

// A locked pairing result
interface Pairing {
  ourPlayer: Player;
  oppPlayer: Player;
  expectedScore: number;
  actualScore?: number;  // Can be filled in after game
  round: 1 | 2 | 3;
}

// Current game state
interface GameState {
  matrix: MatchupMatrix;
  phase: Phase;
  
  // Round 1
  ourDefender1: Player | null;
  oppDefender1: Player | null;
  ourAttackers1: [Player, Player] | null;  // Who we sent
  oppAttackers1: [Player, Player] | null;  // Who they sent
  
  // Round 2
  ourDefender2: Player | null;
  oppDefender2: Player | null;
  ourAttackers2: [Player, Player] | null;
  oppAttackers2: [Player, Player] | null;
  
  // Locked pairings
  pairings: Pairing[];
  
  // Remaining players
  ourRemaining: Player[];
  oppRemaining: Player[];
}

type Phase = 
  | 'home'              // Tournament/team selection
  | 'team-setup'        // Create/edit our team
  | 'tournament-setup'  // Create tournament, name it
  | 'round-setup'       // Enter opponent team for this round
  | 'matrix-entry'
  | 'defender-1-select'
  | 'defender-1-reveal'
  | 'attacker-1-select'
  | 'attacker-1-reveal'
  | 'defender-1-choose'
  | 'defender-2-select'
  | 'defender-2-reveal'
  | 'attacker-2-select'
  | 'attacker-2-reveal'
  | 'defender-2-choose'
  | 'final-pairing'
  | 'round-summary'     // Summary for this round
  | 'tournament-summary'; // Overall tournament view
```

### 2.2 Algorithm Output Types

```typescript
interface DefenderAnalysis {
  player: Player;
  defenderScore: number;        // Second-lowest row value
  worstMatchups: [Player, Player];  // The two attackers opponent would send
  totalExpectedValue: number;   // Including residual game estimate
}

interface AttackerAnalysis {
  attackerPair: [Player, Player];
  expectedScore: number;        // Score opponent gets after choosing
  forcedMatchup: Player;        // Which attacker they'll likely choose to face
}

interface DefenderChoiceAnalysis {
  attacker: Player;
  score: number;
}
```

---

## 3. Application Flow & Screens

### 3.1 Phase Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           HOME                                   │
│  - "New Tournament" button                                      │
│  - List of saved teams (edit/delete)                            │
│  - List of active tournaments (continue/view)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────────┐     ┌───────────────────────────────┐
│       TEAM SETUP          │     │    CONTINUE TOURNAMENT        │
│  (first time or edit)     │     │    (skip to round setup)      │
│  Enter 5 player names     │     └───────────────────────────────┘
│  Enter 5 factions         │                   │
│  Save team for reuse      │                   │
└───────────────────────────┘                   │
            │                                   │
            ▼                                   │
┌───────────────────────────┐                   │
│    TOURNAMENT SETUP       │                   │
│  Tournament name          │                   │
│  Select saved team        │                   │
│  (or create new)          │                   │
└───────────────────────────┘                   │
            │                                   │
            ▼                                   │
            └─────────────────┬─────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND SETUP (per round)                       │
│  Shows: "Round X of 5"                                          │
│  Our team displayed (read-only, from saved team)                │
│  Enter opponent team name                                       │
│  Enter 5 opponent player names + factions                       │
│  "Start Pairing" button                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MATRIX ENTRY                              │
│  Our team (rows) - pre-populated from saved team                │
│  Opponent team (columns) - from round setup                     │
│  Enter expected scores only (names already filled)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 1: DEFENDER SELECT                      │
│  Show all 5 players ranked by DefenderScore                     │
│  Highlight optimal choice, show expected values                  │
│  User selects our defender                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 1: DEFENDER REVEAL                      │
│  User enters opponent's defender choice                         │
│  Display both defenders side by side                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 1: ATTACKER SELECT                      │
│  Show remaining 4 players                                        │
│  Rank all 6 possible attacker pairs by expected outcome         │
│  User selects 2 attackers to send against opp defender          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 1: ATTACKER REVEAL                      │
│  User enters opponent's 2 attackers                             │
│  Display all 4 attackers                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 1: DEFENDER CHOOSE                      │
│  Our defender picks which attacker to face (from their 2)       │
│  Show expected scores for each option                           │
│  User enters opponent's defender choice (which of our 2)        │
│  Lock in 2 pairings                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 2: DEFENDER SELECT                      │
│  Show remaining 3 players ranked by DefenderScore               │
│  User selects our second defender                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 2: DEFENDER REVEAL                      │
│  User enters opponent's second defender                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 2: ATTACKER SELECT                      │
│  Remaining 2 players MUST both attack (no choice)               │
│  Show expected outcome                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 2: ATTACKER REVEAL                      │
│  User confirms opponent's 2 attackers (also forced)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 2: DEFENDER CHOOSE                      │
│  Each defender picks attacker to face                           │
│  Lock in 2 more pairings                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 3: FINAL PAIRING                        │
│  Remaining players face each other (forced)                     │
│  Lock in final pairing                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUND SUMMARY                               │
│  Show all 5 pairings with expected scores                       │
│  Total expected team score for this round                       │
│  Optional: Enter actual scores after games                      │
│  "Next Round" / "Finish Tournament" buttons                     │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────┐                 ┌─────────────────────────────┐
│   NEXT ROUND      │                 │    TOURNAMENT SUMMARY       │
│   (loop back to   │                 │  All rounds overview        │
│   Round Setup)    │                 │  Total tournament score     │
│                   │                 │  Per-round breakdown        │
└───────────────────┘                 │  Export/share results       │
                                      └─────────────────────────────┘
```

### 3.2 Screen Details

#### Screen 0: Home
**Purpose**: Entry point - manage teams and tournaments

**UI Elements**:
- App logo/title
- **"My Teams" section**:
  - List of saved teams with name and player count indicator
  - "Create New Team" button
  - Swipe to edit/delete team
- **"Tournaments" section**:
  - Active tournament card (if any) with "Continue" button
  - Past tournaments list with final scores
  - "New Tournament" button
- Quick action: "Quick Pairing" (one-off without tournament tracking)

**Mobile Optimization**:
- Large touch-friendly cards
- Pull-to-refresh
- Tab bar at bottom for Teams / Tournaments / Settings

#### Screen 1: Team Setup
**Purpose**: Create or edit your persistent team composition

**UI Elements**:
- Team name input (e.g., "Brighton Warhogs")
- 5 player entry cards, each containing:
  - Player name input (e.g., "Dave")
  - Faction dropdown or text input (e.g., "Aeldari")
  - Drag handle for reordering
- "Save Team" button
- "Cancel" button (if editing)

**Mobile Optimization**:
- Single-column card layout
- Large text inputs with clear labels
- Faction autocomplete with common options
- Swipe to reorder players

#### Screen 2: Tournament Setup
**Purpose**: Start a new tournament and link to a team

**UI Elements**:
- Tournament name input (e.g., "London GT January 2026")
- Number of rounds selector (default: 5)
- Team selector dropdown (from saved teams)
- Preview of selected team
- "Start Tournament" button

#### Screen 3: Round Setup
**Purpose**: Enter opponent information for the current round

**UI Elements**:
- Round indicator ("Round 2 of 5")
- **Our Team panel** (read-only):
  - Shows all 5 player names + factions
  - Styled as "locked in" (greyed background, checkmark)
- **Opponent Team panel** (editable):
  - Opponent team name input
  - 5 player entries (name + faction)
  - "Copy from previous round" option (if Round 2+)
- "Continue to Matrix" button

**Mobile Optimization**:
- Our team collapsed by default (expandable)
- Focus on opponent entry
- Recent opponent factions in autocomplete

#### Screen 4: Matrix Entry
**Purpose**: Enter expected matchup scores (streamlined since names are pre-filled)

**UI Elements**:
- Row headers: Our players (pre-filled, read-only)
- Column headers: Opponent players (pre-filled, read-only)
- 5×5 grid of score inputs (0-20 scale, default 10)
- Quick-fill buttons: "All 10s", "Copy Row", "Mirror"
- Color coding: green (favorable) → red (unfavorable)
- "Start Pairing" button

**Mobile Optimization**:
- Scrollable matrix with sticky headers
- Tap cell → modal with +/- stepper and number pad
- "Edit Row" mode: horizontal swipe through one player's matchups
- Landscape mode support for easier grid viewing

#### Screen 2-6: Round 1 Phases
**Common Elements**:
- Phase indicator bar (showing current step)
- "Locked Pairings" sidebar/drawer (collapsible on mobile)
- Running score total
- Back button to previous phase

**Defender Select Screen**:
- Card for each player showing:
  - Name & faction
  - Defender Score (highlighted)
  - Worst two matchups identified
  - Recommendation badge on optimal choice
- Tap to select, confirm button

**Reveal Screens**:
- Simple picker to input opponent's choice
- Dramatic reveal animation (optional)

**Defender Choose Screen**:
- Show the 2 attackers sent against our defender
- Expected score for each matchup
- Clear recommendation
- Separate section for entering opponent's choice

#### Screens 7-11: Round 2 Phases
Same structure as Round 1, but with:
- Only 3 players available for defender
- Attacker selection is forced (only 2 remain)
- Simpler decision tree

#### Screen 12: Final Pairing
- Shows the forced matchup
- Adds to locked pairings automatically

#### Screen 13: Summary
- Table of all 5 pairings
- Per-pairing expected scores
- Total expected score vs neutral (50)
- Share/export results
- "New Pairing" and "Edit Matrix" buttons

---

## 4. Algorithm Implementation

### 4.1 Core Functions

```typescript
// algorithms/defenderScore.ts

/**
 * Calculate the Defender Score for a player
 * DefenderScore = second-lowest value in their row
 */
export function calculateDefenderScore(
  matrix: number[][],
  defenderIndex: number,
  availableOpponents: number[]
): number {
  const scores = availableOpponents.map(oppIdx => matrix[defenderIndex][oppIdx]);
  const sorted = [...scores].sort((a, b) => a - b);
  return sorted[1]; // Second lowest = best we can guarantee
}

/**
 * Find the two attackers opponent would send against a defender
 */
export function findOptimalAttackers(
  matrix: number[][],
  defenderIndex: number,
  availableOpponents: number[]
): [number, number] {
  const scores = availableOpponents.map(oppIdx => ({
    idx: oppIdx,
    score: matrix[defenderIndex][oppIdx]
  }));
  const sorted = scores.sort((a, b) => a.score - b.score);
  return [sorted[0].idx, sorted[1].idx]; // Two lowest scores for us
}

/**
 * Analyze all defender options and rank them
 */
export function analyzeDefenderOptions(
  matrix: number[][],
  availablePlayers: number[],
  availableOpponents: number[]
): DefenderAnalysis[] {
  return availablePlayers
    .map(playerIdx => ({
      playerIndex: playerIdx,
      defenderScore: calculateDefenderScore(matrix, playerIdx, availableOpponents),
      worstMatchups: findOptimalAttackers(matrix, playerIdx, availableOpponents)
    }))
    .sort((a, b) => b.defenderScore - a.defenderScore); // Highest first
}
```

### 4.2 Attacker Selection Algorithm

```typescript
// algorithms/attackerAnalysis.ts

/**
 * Analyze all possible attacker pairs we could send
 * Against opponent's defender
 */
export function analyzeAttackerOptions(
  matrix: number[][],
  oppDefenderIndex: number,
  availablePlayers: number[]
): AttackerAnalysis[] {
  const pairs: AttackerAnalysis[] = [];
  
  // Generate all pairs of available players
  for (let i = 0; i < availablePlayers.length; i++) {
    for (let j = i + 1; j < availablePlayers.length; j++) {
      const p1 = availablePlayers[i];
      const p2 = availablePlayers[j];
      
      // Opponent will choose the better matchup for them (lower score for us)
      const score1 = matrix[p1][oppDefenderIndex];
      const score2 = matrix[p2][oppDefenderIndex];
      
      // The score we expect = max of the two (opponent picks the min)
      const expectedScore = Math.min(score1, score2);
      const forcedAttacker = score1 <= score2 ? p1 : p2;
      
      pairs.push({
        attackers: [p1, p2],
        expectedScore,
        forcedMatchup: forcedAttacker,
        refusedAttacker: score1 <= score2 ? p2 : p1
      });
    }
  }
  
  // Sort by expected score descending (best outcomes first)
  return pairs.sort((a, b) => b.expectedScore - a.expectedScore);
}
```

### 4.3 Full Game Tree Evaluation (Advanced)

```typescript
// algorithms/gameTree.ts

interface GameResult {
  totalScore: number;
  pairings: Array<{ our: number; opp: number; score: number }>;
}

/**
 * Recursively evaluate the game tree using backward induction
 * This gives truly optimal play considering all future rounds
 */
export function evaluateGameTree(
  matrix: number[][],
  ourRemaining: number[],
  oppRemaining: number[],
  depth: number = 0
): GameResult {
  // Base case: Round 3 - forced pairing
  if (ourRemaining.length === 1) {
    const score = matrix[ourRemaining[0]][oppRemaining[0]];
    return {
      totalScore: score,
      pairings: [{ our: ourRemaining[0], opp: oppRemaining[0], score }]
    };
  }
  
  let bestResult: GameResult = { totalScore: -Infinity, pairings: [] };
  
  // Try each possible defender choice
  for (const ourDefender of ourRemaining) {
    // Opponent sends optimal attackers
    const oppAttackers = findOptimalAttackers(matrix, ourDefender, oppRemaining);
    
    // We choose the better matchup
    const score1 = matrix[ourDefender][oppAttackers[0]];
    const score2 = matrix[ourDefender][oppAttackers[1]];
    const chosenOpp = score1 >= score2 ? oppAttackers[0] : oppAttackers[1];
    const thisRoundScore = Math.max(score1, score2);
    
    // Calculate remaining players after this round
    // (Simplified - full implementation needs to handle opponent's defender too)
    const newOurRemaining = ourRemaining.filter(p => p !== ourDefender);
    const newOppRemaining = oppRemaining.filter(p => p !== chosenOpp);
    
    // Recurse for future rounds
    const futureResult = evaluateGameTree(matrix, newOurRemaining, newOppRemaining, depth + 1);
    
    const totalScore = thisRoundScore + futureResult.totalScore;
    
    if (totalScore > bestResult.totalScore) {
      bestResult = {
        totalScore,
        pairings: [
          { our: ourDefender, opp: chosenOpp, score: thisRoundScore },
          ...futureResult.pairings
        ]
      };
    }
  }
  
  return bestResult;
}
```

### 4.4 Algorithm Complexity Notes

| Algorithm | Time Complexity | Notes |
|-----------|-----------------|-------|
| Defender Score | O(n log n) | Sort row of n opponents |
| Attacker Analysis | O(n²) | All pairs of n players |
| Full Game Tree | O(n! × n²) | Exponential but n=5 is tractable |

With n=5, full game tree evaluation is ~120 × 25 = 3,000 operations — fast enough for real-time calculation.

---

## 5. State Management

### 5.1 Zustand Store Structure

The app uses multiple stores for different concerns:

```typescript
// store/teamStore.ts - Persistent team management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TeamStore {
  teams: Team[];
  
  // Actions
  createTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  getTeam: (id: string) => Team | undefined;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      teams: [],
      
      createTeam: (teamData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newTeam: Team = {
          ...teamData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ teams: [...state.teams, newTeam] }));
        return id;
      },
      
      updateTeam: (id, updates) => {
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },
      
      deleteTeam: (id) => {
        set((state) => ({ teams: state.teams.filter((t) => t.id !== id) }));
      },
      
      getTeam: (id) => get().teams.find((t) => t.id === id),
    }),
    { name: 'uktc-teams' }
  )
);
```

```typescript
// store/tournamentStore.ts - Tournament tracking
interface TournamentStore {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  
  // Actions
  createTournament: (name: string, teamId: string, numRounds?: number) => string;
  setActiveTournament: (id: string | null) => void;
  getActiveTournament: () => Tournament | undefined;
  
  // Round management
  startRound: (tournamentId: string, opponent: { name: string; players: Player[] }) => void;
  updateRoundMatrix: (tournamentId: string, roundNumber: number, matrix: number[][]) => void;
  completeRound: (tournamentId: string, roundNumber: number, pairings: Pairing[]) => void;
  updateActualScores: (tournamentId: string, roundNumber: number, scores: number[]) => void;
  
  // Cleanup
  deleteTournament: (id: string) => void;
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournaments: [],
      activeTournamentId: null,
      
      createTournament: (name, teamId, numRounds = 5) => {
        const team = useTeamStore.getState().getTeam(teamId);
        if (!team) throw new Error('Team not found');
        
        const id = crypto.randomUUID();
        const tournament: Tournament = {
          id,
          name,
          ourTeam: team,
          rounds: Array.from({ length: numRounds }, (_, i) => ({
            roundNumber: i + 1,
            opponentTeamName: '',
            opponentPlayers: [],
            matrix: [],
            pairings: [],
            status: 'not_started',
          })),
          currentRound: 1,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          tournaments: [...state.tournaments, tournament],
          activeTournamentId: id,
        }));
        return id;
      },
      
      // ... other implementations
    }),
    { name: 'uktc-tournaments' }
  )
);
```

```typescript
// store/pairingStore.ts - Current pairing session state
interface PairingStore {
  // Current round reference
  tournamentId: string | null;
  roundNumber: number | null;
  
  // Matrix data (loaded from tournament round)
  matrix: number[][] | null;
  ourTeam: Player[];
  oppTeam: Player[];
  
  // Current phase
  phase: Phase;
  
  // Round 1 state
  ourDefender1: number | null;
  oppDefender1: number | null;
  ourAttackers1: [number, number] | null;
  oppAttackers1: [number, number] | null;
  round1Pairings: Pairing[];
  
  // Round 2 state
  ourDefender2: number | null;
  oppDefender2: number | null;
  round2Pairings: Pairing[];
  
  // Round 3 state
  finalPairing: Pairing | null;
  
  // Actions
  initializeFromTournament: (tournamentId: string, roundNumber: number) => void;
  setMatrix: (matrix: number[][]) => void;
  setPhase: (phase: Phase) => void;
  selectOurDefender1: (playerIndex: number) => void;
  revealOppDefender1: (playerIndex: number) => void;
  selectOurAttackers1: (attackers: [number, number]) => void;
  revealOppAttackers1: (attackers: [number, number]) => void;
  lockRound1Pairings: (ourChoice: number, oppChoice: number) => void;
  // ... similar for round 2
  
  // Computed helpers
  getOurRemaining: () => number[];
  getOppRemaining: () => number[];
  getTotalExpectedScore: () => number;
  
  // Finalization
  completePairing: () => Pairing[]; // Returns all pairings and saves to tournament
  
  // Reset
  resetPairing: () => void;
}
```

### 5.2 Persistence Strategy

| Store | Storage Key | Persisted Data | Lifetime |
|-------|-------------|----------------|----------|
| TeamStore | `uktc-teams` | All saved teams | Permanent until deleted |
| TournamentStore | `uktc-tournaments` | All tournaments + rounds | Permanent until deleted |
| PairingStore | `uktc-current-pairing` | Current pairing session | Cleared on completion |

**Key behaviors**:
- Teams persist indefinitely across browser sessions
- Tournaments persist with all round data
- Active pairing session is recoverable if user closes browser mid-pairing
- "Resume Pairing" shown on Home if incomplete session exists
- Export all data as JSON for backup/transfer

---

## 6. Component Architecture

### 6.1 Component Tree

```
App
├── Layout
│   ├── Header (phase indicator, back button, tournament info)
│   ├── Main (current phase content)
│   └── BottomNav (Home / Tournament / Settings tabs)
│
├── Pages/
│   ├── HomePage
│   │   ├── TeamsList
│   │   │   └── TeamCard (swipe to edit/delete)
│   │   ├── TournamentsList
│   │   │   └── TournamentCard (active indicator, continue button)
│   │   └── QuickActions
│   │
│   ├── TeamSetupPage
│   │   ├── TeamNameInput
│   │   ├── PlayerInputList
│   │   │   └── PlayerInputCard (×5, draggable)
│   │   │       ├── NameInput
│   │   │       ├── FactionInput (with autocomplete)
│   │   │       └── DragHandle
│   │   └── SaveButton
│   │
│   ├── TournamentSetupPage
│   │   ├── TournamentNameInput
│   │   ├── RoundCountSelector
│   │   ├── TeamSelector (dropdown of saved teams)
│   │   ├── TeamPreview
│   │   └── StartButton
│   │
│   ├── RoundSetupPage
│   │   ├── RoundIndicator ("Round 2 of 5")
│   │   ├── OurTeamPreview (collapsible, read-only)
│   │   ├── OpponentTeamInput
│   │   │   ├── OpponentTeamNameInput
│   │   │   └── OpponentPlayerInputList (×5)
│   │   └── ContinueButton
│   │
│   ├── MatrixEntryPage
│   │   ├── MatrixGrid
│   │   │   ├── StickyRowHeaders (our players)
│   │   │   ├── StickyColumnHeaders (opponent players)
│   │   │   └── MatrixCell (×25)
│   │   ├── QuickFillButtons
│   │   └── StartPairingButton
│   │
│   ├── DefenderSelectPage
│   │   ├── RemainingPlayersList
│   │   ├── DefenderCard (×3-5)
│   │   │   ├── PlayerInfo
│   │   │   ├── DefenderScoreBadge
│   │   │   ├── RecommendedBadge (if optimal)
│   │   │   └── WorstMatchupsPreview
│   │   └── ConfirmButton
│   │
│   ├── DefenderRevealPage
│   │   ├── OurDefenderDisplay
│   │   ├── OppDefenderPicker
│   │   ├── DefenderComparison
│   │   └── ContinueButton
│   │
│   ├── AttackerSelectPage
│   │   ├── TargetDefenderDisplay (opponent's defender)
│   │   ├── AttackerPairOptions
│   │   │   └── AttackerPairCard (×6 or ×1)
│   │   │       ├── PlayerPairDisplay
│   │   │       ├── ExpectedScoreBadge
│   │   │       └── RecommendedBadge
│   │   └── ConfirmButton
│   │
│   ├── AttackerRevealPage
│   │   ├── OurAttackersDisplay
│   │   ├── OppAttackerPicker (multi-select, ×2)
│   │   └── ContinueButton
│   │
│   ├── DefenderChoosePage
│   │   ├── OurDefenderSection
│   │   │   ├── DefenderDisplay
│   │   │   ├── AttackerOption (×2, with scores)
│   │   │   └── SelectButton
│   │   ├── OppDefenderSection
│   │   │   ├── DefenderDisplay
│   │   │   ├── OurAttackersDisplay
│   │   │   └── OppChoicePicker
│   │   └── LockPairingsButton
│   │
│   ├── FinalPairingPage
│   │   └── ForcedMatchupDisplay
│   │
│   ├── RoundSummaryPage
│   │   ├── PairingsTable
│   │   ├── ExpectedScoreTotal
│   │   ├── ActualScoreInputs (optional)
│   │   └── NextRoundButton / FinishButton
│   │
│   └── TournamentSummaryPage
│       ├── RoundsAccordion
│       │   └── RoundSummaryCard (×5)
│       ├── TotalScoreDisplay
│       ├── ExportButton
│       └── NewTournamentButton
│
└── Components/
    ├── Cards/
    │   ├── PlayerCard
    │   ├── DefenderCard
    │   ├── AttackerPairCard
    │   ├── TeamCard
    │   └── TournamentCard
    ├── Inputs/
    │   ├── PlayerInput
    │   ├── FactionAutocomplete
    │   ├── ScoreInput (with +/- stepper)
    │   └── PlayerPicker (dropdown/modal)
    ├── Matrix/
    │   ├── MatrixGrid
    │   ├── MatrixCell
    │   └── MatrixRowEditor
    ├── Display/
    │   ├── ScoreBadge
    │   ├── RecommendedBadge
    │   ├── PhaseIndicator
    │   ├── RoundIndicator
    │   └── MatchupPreview
    ├── Drawers/
    │   ├── LockedPairingsDrawer
    │   └── TeamPreviewDrawer
    └── Common/
        ├── Button
        ├── Card
        ├── Modal
        └── BottomSheet
```

### 6.2 Key Component Specifications

#### PlayerCard
```tsx
interface PlayerCardProps {
  player: Player;
  score?: number;
  isSelected?: boolean;
  isRecommended?: boolean;
  onClick?: () => void;
  details?: React.ReactNode;
}
```

#### DefenderCard (extends PlayerCard)
```tsx
interface DefenderCardProps extends PlayerCardProps {
  defenderScore: number;
  worstMatchups: [Player, Player];
  rank: number;
}
```

#### LockedPairingsDrawer
- Slides up from bottom on mobile
- Shows all locked pairings
- Running total score
- Collapsible to save screen space

---

## 7. Mobile Optimization

### 7.1 Responsive Design Principles

| Aspect | Mobile Approach |
|--------|-----------------|
| Layout | Single column, full-width cards |
| Touch targets | Minimum 44×44px, ideally 48×48px |
| Navigation | Bottom sheet for drawer, swipe gestures |
| Matrix input | Horizontal scroll with sticky row/column headers |
| Typography | 16px minimum for inputs (prevents iOS zoom) |
| Spacing | Generous padding (16-24px) for thumb reach |

### 7.2 Tailwind Breakpoints

```tsx
// Mobile-first approach
// Default: mobile (<640px)
// sm: tablet (≥640px)
// md: small desktop (≥768px)
// lg: desktop (≥1024px)

// Example usage
<div className="
  flex flex-col          // Mobile: stack vertically
  sm:flex-row           // Tablet+: side by side
  gap-4
  p-4 sm:p-6
">
```

### 7.3 Specific Mobile Considerations

**Matrix Entry**:
- Use a modal/full-screen view for editing individual cells
- Pinch-to-zoom on matrix grid
- "Edit row" mode to input all values for one player at once

**Card Selection**:
- Large tap areas covering entire card
- Visual feedback on touch (scale, shadow)
- Haptic feedback on selection (if available)

**Phase Navigation**:
- Swipe right to go back (with confirmation)
- Bottom navigation bar showing phase progress
- Pull-to-refresh to recalculate recommendations

---

## 8. Project Structure

```
uktc-pairing-optimizer/
├── public/
│   ├── favicon.ico
│   └── manifest.json          # PWA manifest for mobile
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── algorithms/
│   │   ├── defenderScore.ts
│   │   ├── attackerAnalysis.ts
│   │   ├── gameTree.ts
│   │   └── __tests__/
│   │       ├── defenderScore.test.ts
│   │       └── attackerAnalysis.test.ts
│   │
│   ├── store/
│   │   ├── teamStore.ts       # Persistent team management
│   │   ├── tournamentStore.ts # Tournament tracking
│   │   ├── pairingStore.ts    # Current pairing session
│   │   └── types.ts
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── TeamSetupPage.tsx
│   │   ├── TournamentSetupPage.tsx
│   │   ├── RoundSetupPage.tsx
│   │   ├── MatrixEntryPage.tsx
│   │   ├── DefenderSelectPage.tsx
│   │   ├── DefenderRevealPage.tsx
│   │   ├── AttackerSelectPage.tsx
│   │   ├── AttackerRevealPage.tsx
│   │   ├── DefenderChoosePage.tsx
│   │   ├── FinalPairingPage.tsx
│   │   ├── RoundSummaryPage.tsx
│   │   └── TournamentSummaryPage.tsx
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── PhaseIndicator.tsx
│   │   ├── Cards/
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── DefenderCard.tsx
│   │   │   ├── AttackerPairCard.tsx
│   │   │   ├── TeamCard.tsx
│   │   │   └── TournamentCard.tsx
│   │   ├── Inputs/
│   │   │   ├── PlayerInput.tsx
│   │   │   ├── FactionAutocomplete.tsx
│   │   │   ├── ScoreInput.tsx
│   │   │   └── PlayerPicker.tsx
│   │   ├── Matrix/
│   │   │   ├── MatrixGrid.tsx
│   │   │   ├── MatrixCell.tsx
│   │   │   └── MatrixRowEditor.tsx
│   │   ├── Display/
│   │   │   ├── ScoreBadge.tsx
│   │   │   ├── RecommendedBadge.tsx
│   │   │   ├── RoundIndicator.tsx
│   │   │   └── MatchupPreview.tsx
│   │   ├── Drawers/
│   │   │   ├── LockedPairingsDrawer.tsx
│   │   │   └── TeamPreviewDrawer.tsx
│   │   └── Common/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── BottomSheet.tsx
│   │       └── Select.tsx
│   │
│   ├── hooks/
│   │   ├── useDefenderAnalysis.ts
│   │   ├── useAttackerAnalysis.ts
│   │   ├── useGameState.ts
│   │   └── usePersistedState.ts
│   │
│   ├── data/
│   │   └── factions.ts        # Faction list for autocomplete
│   │
│   └── utils/
│       ├── scoring.ts
│       ├── uuid.ts
│       └── export.ts          # JSON export/import helpers
│
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
└── vercel.json
```

---
## 9. Development Task Checklist
see @to-do.md
---

## 12. Future Enhancements

### v1.1
- Matrix templates (save common opponent matchup patterns)
- "Copy matrix from previous round" with adjustments
- Faction-based matchup presets (community-sourced defaults)

### v1.2
- Probability distributions instead of point estimates
- Monte Carlo simulation for uncertain matchups
- Historical results tracking per faction matchup

### v2.0
- Multi-team tournament bracket support
- Team composition optimizer (which 5 lists to bring)
- Integration with ITC/BCP for published lists
- Cloud sync for team data across devices

---

## 13. Faction Data Reference

The app includes a pre-populated list of Warhammer 40K factions for autocomplete. This improves UX and ensures consistency.

```typescript
// src/data/factions.ts
export const FACTIONS = [
  // Imperium
  "Adepta Sororitas",
  "Adeptus Custodes",
  "Adeptus Mechanicus",
  "Astra Militarum",
  "Black Templars",
  "Blood Angels",
  "Dark Angels",
  "Deathwatch",
  "Grey Knights",
  "Imperial Agents",
  "Imperial Knights",
  "Space Marines",
  "Space Wolves",
  
  // Chaos
  "Chaos Daemons",
  "Chaos Knights",
  "Chaos Space Marines",
  "Death Guard",
  "Emperor's Children",
  "Thousand Sons",
  "World Eaters",
  
  // Xenos
  "Aeldari",
  "Drukhari",
  "Genestealer Cults",
  "Leagues of Votann",
  "Necrons",
  "Orks",
  "T'au Empire",
  "Tyranids",
] as const;

export type Faction = typeof FACTIONS[number];
```

---

## 14. Appendix: Example Test Cases

### Test Matrix (from document)
```typescript
const testMatrix = [
  [10, 8, 15, 12, 6],   // Player 1
  [14, 10, 9, 11, 13],  // Player 2
  [7, 12, 10, 8, 16],   // Player 3
  [11, 6, 13, 10, 9],   // Player 4
  [9, 15, 7, 14, 10],   // Player 5
];

// Expected Defender Scores:
// Player 1: 8  (sorted: 6,8,10,12,15 → second = 8)
// Player 2: 10 (sorted: 9,10,11,13,14 → second = 10) ← BEST
// Player 3: 8  (sorted: 7,8,10,12,16 → second = 8)
// Player 4: 9  (sorted: 6,9,10,11,13 → second = 9)
// Player 5: 9  (sorted: 7,9,10,14,15 → second = 9)
```

### Expected Results
| Test | Input | Expected Output |
|------|-------|-----------------|
| Best Defender | Full matrix, all players | Player 2 (score 10) |
| Player 1 worst matchups | Player 1 defending | Opp 5 (6), Opp 2 (8) |
| Player 2 worst matchups | Player 2 defending | Opp 3 (9), Opp 2 (10) |

---

## 15. User Flow Summary

### First-Time User
1. Open app → Home (empty state)
2. Tap "Create Team" → Team Setup
3. Enter team name + 5 players with factions
4. Save → Back to Home (team now listed)
5. Tap "New Tournament" → Tournament Setup
6. Enter tournament name, select team
7. Start → Round Setup for Round 1
8. Enter opponent team details
9. Continue → Matrix Entry (our team pre-filled)
10. Enter matchup scores
11. Proceed through pairing phases...

### Returning User (Round 2+)
1. Open app → Home shows active tournament
2. Tap "Continue" on tournament card
3. → Round Setup for next round (our team already loaded)
4. Enter new opponent details only
5. Continue to Matrix Entry...

### Quick Pairing (No Tournament)
1. Home → "Quick Pairing" button
2. Select saved team (or create new)
3. Enter opponent details
4. Matrix entry → Pairing phases → Summary
5. Results not saved to tournament history

---

*Plan Version 2.0 | Updated with Persistent Teams & Tournament Tracking*

# Pairing Phase Pages Implementation Plan (Phases 14 & 15)

## Overview

Implementing the 11 pairing phase pages for the UKTC Pairing Optimizer. These guide users through the game-theoretic pairing process after entering the matchup matrix.

---

## Entry Point (Already Complete)

**MatrixEntryPage** (`src/pages/MatrixEntryPage.tsx`) on "Start Pairing":
1. Saves matrix via `updateRoundMatrix(id, roundIdx, matrix)`
2. Calls `initializeFromTournament(id, roundIdx)` to load into pairingStore
3. Sets `phase` to `'defender-1-select'`
4. Navigates to `/tournament/:id/round/:roundIndex/pairing/defender-1-select`

**HomePage** detects incomplete sessions and shows "Resume Pairing" button.

---

## Architecture

Single `PairingPhasePage.tsx` with phase-specific content components:

```
src/pages/
├── PairingPhasePage.tsx          # Router for all 11 pairing phases
└── pairing/
    ├── DefenderSelectContent.tsx # Round 1 & 2 defender selection
    ├── DefenderRevealContent.tsx # Round 1 & 2 reveal opponent defender
    ├── AttackerSelectContent.tsx # Round 1 & 2 attacker pair selection
    ├── AttackerRevealContent.tsx # Round 1 & 2 reveal opponent attackers
    ├── DefenderChooseContent.tsx # Round 1 & 2 defender chooses attacker
    └── FinalPairingContent.tsx   # Final forced matchup
```

---

## Files to Create

### 1. `src/pages/PairingPhasePage.tsx`

Main router component:
- Reads `phase` from URL params (`useParams`)
- Renders appropriate content component based on phase
- Uses `Layout` with `showNav={false}` and `currentPhase` for PhaseIndicator
- Provides navigation helper to content components

```tsx
// Key structure
const { id, roundIndex, phase } = useParams();
const navigate = useNavigate();
const pairingStore = usePairingStore();

const goToNextPhase = (nextPhase: Phase) => {
  pairingStore.setPhase(nextPhase);
  navigate(`/tournament/${id}/round/${roundIndex}/pairing/${nextPhase}`);
};

// Switch on phase to render content
```

### 2. `src/pages/pairing/DefenderSelectContent.tsx`

**Props**: `{ round: 1 | 2; onNext: (phase: Phase) => void }`

**Flow**:
1. Get `ourRemaining`, `oppRemaining`, `matrix` from `usePairingStore()`
2. Call `analyzeDefenderOptions(matrix.scores, ourIndices, oppIndices)`
3. Display `DefenderCard` for each (sorted by defenderScore, highest first)
4. Track selected player in local state
5. On "Confirm Defender": call `setOurDefender1(player)` or `setOurDefender2(player)`
6. Call `onNext('defender-1-reveal')` or `onNext('defender-2-reveal')`

### 3. `src/pages/pairing/DefenderRevealContent.tsx`

**Props**: `{ round: 1 | 2; onNext: (phase: Phase) => void }`

**Flow**:
1. Display our defender (from `round1.ourDefender` or `round2.ourDefender`)
2. `PlayerPicker` for opponent's defender (from `oppRemaining`)
3. On "Continue": call `setOppDefender1(player)` or `setOppDefender2(player)`
4. Call `onNext('attacker-1-select')` or `onNext('attacker-2-select')`

### 4. `src/pages/pairing/AttackerSelectContent.tsx`

**Props**: `{ round: 1 | 2; onNext: (phase: Phase) => void }`

**Flow**:
1. Show opponent's defender as "target"
2. Get available attackers (ourRemaining minus ourDefender)
3. Call `analyzeAttackerPairs(matrix.scores, oppDefender.index, availableIndices)`
4. Display `AttackerPairCard` for each pair
   - Round 1: 6 pairs from 4 players
   - Round 2: 1 forced pair from 2 players (auto-select)
5. On "Confirm": call `setOurAttackers1([p1, p2])` or `setOurAttackers2([p1, p2])`
6. Call `onNext('attacker-1-reveal')` or `onNext('attacker-2-reveal')`

### 5. `src/pages/pairing/AttackerRevealContent.tsx`

**Props**: `{ round: 1 | 2; onNext: (phase: Phase) => void }`

**Flow**:
1. Display our 2 attackers
2. Two `PlayerPicker` components for opponent's attackers
3. Use `disabledPlayers` prop to prevent selecting same player twice
4. On "Continue": call `setOppAttackers1([p1, p2])` or `setOppAttackers2([p1, p2])`
5. Call `onNext('defender-1-choose')` or `onNext('defender-2-choose')`

### 6. `src/pages/pairing/DefenderChooseContent.tsx`

**Props**: `{ round: 1 | 2; onNext: (phase: Phase) => void }`

Most complex phase - both defenders choose which attacker to face.

**Flow**:
1. **Our defender section**: Show 2 opponent attackers with expected scores (use `ScoreBadge`), user selects one
2. **Opponent defender section**: Show our 2 attackers, `PlayerPicker` for which one opponent chose
3. On "Lock Pairings":
   - Call `choosePairing(ourDefender, ourChoice, round)` - our defender vs their attacker we chose
   - Call `choosePairing(oppChoice, oppDefender, round)` - their defender vs our attacker they chose
   - Round 1: `onNext('defender-2-select')`
   - Round 2: `onNext('final-pairing')`

### 7. `src/pages/pairing/FinalPairingContent.tsx`

**Props**: `{ onComplete: () => void }`

**Flow**:
1. Get `ourRemaining[0]`, `oppRemaining[0]` - only 1 player each
2. Display forced matchup using `MatchupPreview`
3. Show all 4 locked pairings + this final one
4. On "Complete Pairing":
   - Call `choosePairing(ourPlayer, oppPlayer, 3)`
   - Navigate to `/tournament/:id/round/:roundIndex/summary`

---

## File to Modify

### `src/App.tsx`

Replace placeholder `PairingPhasePage` with import:

```tsx
import { PairingPhasePage } from '@/pages/PairingPhasePage';
```

Remove the inline placeholder function.

---

## Key Store Actions (from `usePairingStore`)

```typescript
// State
matrix, ourRemaining, oppRemaining, round1, round2, pairings, tournamentId, roundIndex

// Round 1 setters
setOurDefender1(player), setOppDefender1(player)
setOurAttackers1([p1, p2]), setOppAttackers1([p1, p2])

// Round 2 setters
setOurDefender2(player), setOppDefender2(player)
setOurAttackers2([p1, p2]), setOppAttackers2([p1, p2])

// Pairing
choosePairing(ourPlayer, oppPlayer, round) // Creates pairing and removes from remaining

// Phase
setPhase(phase), advancePhase()
```

---

## Algorithm Functions

```typescript
import { analyzeDefenderOptions, type DefenderAnalysis } from '@/algorithms/defenderScore';
import { analyzeAttackerPairs, type AttackerPairAnalysis } from '@/algorithms/attackerAnalysis';
```

**analyzeDefenderOptions(matrix, ourIndices, oppIndices)** → `DefenderAnalysis[]`
- Returns defenders sorted by defenderScore (highest = best, rank #1)

**analyzeAttackerPairs(matrix, oppDefenderIndex, ourIndices)** → `AttackerPairAnalysis[]`
- Returns pairs sorted by expectedScore (highest = best)

---

## Existing Components to Use

| Component | Key Props |
|-----------|-----------|
| `DefenderCard` | `player`, `analysis: DefenderAnalysis`, `opponentPlayers`, `rank`, `selected`, `onClick` |
| `AttackerPairCard` | `analysis: AttackerPairAnalysis`, `ourPlayers`, `oppDefender`, `rank`, `selected`, `onClick` |
| `PlayerPicker` | `players`, `value`, `onChange`, `disabledPlayers`, `useModal`, `label` |
| `PlayerCard` | `player`, `score?`, `selected?` |
| `MatchupPreview` | `ourPlayer`, `oppPlayer`, `expectedScore`, `round`, `compact?` |
| `ScoreBadge` | `score`, `showDelta?` |
| `Button` | `variant`, `fullWidth`, `disabled`, `onClick` |
| `Card` | `children`, `className` |
| `Layout` | `title`, `showBack`, `showNav`, `currentPhase` |

---

## Navigation Flow

```
MatrixEntryPage
    ↓ "Start Pairing"
defender-1-select → defender-1-reveal → attacker-1-select → attacker-1-reveal → defender-1-choose
    ↓ "Lock Pairings" (2 pairings locked)
defender-2-select → defender-2-reveal → attacker-2-select → attacker-2-reveal → defender-2-choose
    ↓ "Lock Pairings" (2 more pairings locked)
final-pairing
    ↓ "Complete Pairing" (1 final pairing locked)
RoundSummaryPage
```

---

## Verification

### Manual Test
1. Create team → Create tournament → Round setup → Matrix entry
2. Click "Start Pairing" → DefenderSelectContent with ranked cards
3. Complete full Round 1 flow (5 phases)
4. Complete full Round 2 flow (5 phases)
5. FinalPairingContent → Complete → RoundSummaryPage

### Persistence Test
1. Start pairing, advance to attacker-1-select
2. Close browser
3. Reopen → "Resume Pairing" on HomePage
4. Click → return to correct phase with data intact

### Algorithm Test
Test matrix (from spec):
```typescript
const testMatrix = [
  [10, 8, 15, 12, 6],   // Player 1 - DefenderScore: 8
  [14, 10, 9, 11, 13],  // Player 2 - DefenderScore: 10 ← BEST
  [7, 12, 10, 8, 16],   // Player 3 - DefenderScore: 8
  [11, 6, 13, 10, 9],   // Player 4 - DefenderScore: 9
  [9, 15, 7, 14, 10],   // Player 5 - DefenderScore: 9
];
```
Expected: Player 2 recommended as defender (#1 rank)

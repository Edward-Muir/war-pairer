# 8-Player (WTC) Team Support — Implementation Guide

## Overview

Extend the app from 5-player-only to supporting both 5 and 8 player teams. Team size is chosen at team creation; game format is inferred from the team.

This is a large cross-cutting change. It is split into **6 atomic sessions** that can be executed in series, each building on the previous. Every session should end with a passing build (`npm run build`) and tests (`npm run test:run`).

---

## WTC 8-Player Pairing Rules

### Round Structure

| Round | Players Per Side | Process                                        | Pairings Locked |
| ----- | ---------------- | ---------------------------------------------- | --------------- |
| 1     | 8                | Standard defender/attacker exchange            | 2 (→ 6 remain)  |
| 2     | 6                | Standard defender/attacker exchange            | 2 (→ 4 remain)  |
| 3     | 4                | Special "final round" — resolves ALL remaining | 4 (→ 0 remain)  |

### Standard Round (Rounds 1 & 2)

Same as current 5v5 flow:

1. Both sides secretly pick a defender, reveal simultaneously
2. Both sides secretly pick 2 attackers to send against opposing defender, reveal simultaneously
3. Each defender refuses 1 attacker, accepts the other (the "choose" step)
4. **2 pairings locked**: our defender vs their accepted attacker, their defender vs our accepted attacker
5. The 2 refused attackers return to the pool

### Final Round (Round 3 — 4v4) — THE KEY DIFFERENCE

With 4 players per side, the round resolves ALL 4 remaining pairings at once:

1. Each side picks 1 defender from their 4 remaining (leaving 3 others)
2. Each side picks 2 of the remaining 3 as attackers (leaving 1 "uninvolved" player)
3. Attackers are revealed. Each defender refuses 1, accepts 1 (normal choose step)
4. **4 pairings are locked simultaneously**:
   - **Game 5**: Our defender vs their accepted attacker
   - **Game 6**: Their defender vs our accepted attacker
   - **Game 7**: Our refused attacker vs their refused attacker (automatic)
   - **Game 8**: Our uninvolved player vs their uninvolved player (automatic)

The refused attackers and uninvolved players are paired automatically — no further choice.

### Comparison: 5v5 vs 8v8

|                      | 5v5 (UKTC)                | 8v8 (WTC)                                       |
| -------------------- | ------------------------- | ----------------------------------------------- |
| Selection rounds     | 2 standard + 1 forced 1v1 | 2 standard + 1 special 4v4                      |
| Total pairings       | 5                         | 8                                               |
| Final round          | 1v1 forced (no choice)    | 4v4 resolves 4 pairings with auto-pairings      |
| UI pairing phases    | 11 (5+5+1)                | 16 (5+5+5+1)                                    |
| Algorithm complexity | ~1,350 ops (instant)      | ~millions (needs memoization + loading spinner) |

---

## Current Hardcoded Assumptions (What Must Change)

### Types (`src/store/types.ts`)

- `Team.players`: typed as `[Player, Player, Player, Player, Player]` (5-tuple) — needs to become `Player[]`
- `Pairing.round`: typed as `1 | 2 | 3` — needs to become `number`
- `Phase` union: hardcoded phases for rounds 1-2 only — needs template literal types for any round
- `CreateTeamInput.players`: also 5-tuple

### Team Store (`src/store/teamStore.ts`)

- `createDefaultPlayers()`: creates exactly 5 players via `[0, 1, 2, 3, 4].map()`
- Returns 5-tuple type

### Game Store (`src/store/gameStore.ts`)

- `createGame()`: `matrix: Array(5).fill(null).map(() => Array(5).fill(10))`

### Pairing Store (`src/store/pairingStore.ts`)

- State has only `round1` and `round2` (`RoundSelectionState`)
- 8 named setters: `setOurDefender1`, `setOurDefender2`, `setOurAttackers1`, etc.
- `phaseOrder` array hardcoded for 2 selection rounds + final
- `partialize` persists only `round1`/`round2`
- `choosePairing` takes `round: 1 | 2 | 3`

### Algorithm (`src/algorithms/fullGameTheory.ts`)

- Recursive and mostly size-agnostic already
- Base case `ourRemaining.length === 1` works for 5v5 — needs `length === 2` case for 8v8 final round
- `resolveAttackerExchange` doesn't track refused/uninvolved players (needed for 4v4 auto-pairings)
- `numRemainingPairings` in `analyzeOpponentAttackerPhase` is hardcoded
- No memoization — critical for 8v8 performance

### UI Pages (all in `src/pages/pairing/`)

- All 5 content components have `round: 1 | 2` prop type
- All use `round1.ourDefender`/`round2.ourDefender` pattern with named accessors
- All use named setters like `setOurDefender1`/`setOurDefender2`
- All have hardcoded next-phase strings

### Other UI

- `PairingPhasePage.tsx`: hardcoded `phaseRound`, `phaseTitles`, `previousPhaseMap`
- `PhaseIndicator.tsx`: hardcoded 11-phase array
- `MatrixEntryPage.tsx`: `matrix?.length === 5`, `Array(5)` initialization
- `GameSummaryPage.tsx`: `sessionPairings.length === 5`
- `TeamSetupPage.tsx`: 5-tuple cast
- `FinalPairingContent.tsx`: hardcodes `round: 3`, assumes 1 player remaining
- `MethodologyPage.tsx` / `AdvancedMathSection.tsx`: explanatory text references "5v5"
- `MatchupPreview` component: `round: 1 | 2 | 3` prop

---

## Session 1: Types & Team/Game Stores

**Goal**: Make the type system and data layer support both 5 and 8 player teams. After this session, you can create teams with 5 or 8 players and games with correctly-sized matrices. Existing 5v5 flow still works.

### Files to Modify

#### `src/store/types.ts`

1. Add `TeamSize` type:

```typescript
export type TeamSize = 5 | 8;
```

2. Add helper functions:

```typescript
/** Number of selection rounds before final */
export function getSelectionRoundCount(size: TeamSize): number {
  return size === 5 ? 2 : 3;
}

/** Total pairings in a complete game */
export function getTotalPairings(size: TeamSize): number {
  return size;
}

/** Whether this is the final selection round (4v4 in 8v8, or round 2 in 5v5) */
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
```

3. Change `Team` interface:

```typescript
export interface Team {
  id: string;
  teamName: string;
  teamSize: TeamSize; // NEW
  players: Player[]; // CHANGED from 5-tuple
  createdAt: string;
  updatedAt: string;
}
```

4. Change `Pairing.round` from `1 | 2 | 3` to `number`

5. Change `Phase` type to use template literals:

```typescript
export type Phase =
  | 'home'
  | 'team-setup'
  | 'game-setup'
  | 'matrix-entry'
  | `defender-${number}-select`
  | `defender-${number}-reveal`
  | `attacker-${number}-select`
  | `attacker-${number}-reveal`
  | `defender-${number}-choose`
  | 'final-pairing'
  | 'game-summary';
```

6. Change `CreateTeamInput.players` from 5-tuple to `Player[]`, add `teamSize: TeamSize`

7. Change `Game.matrix` comment from "5x5 scores" to "NxN scores" (type is already `number[][]`)

#### `src/store/teamStore.ts`

1. `createDefaultPlayers(teamSize: TeamSize = 5): Player[]` — use `Array.from({length: teamSize}, ...)`
2. Return type changes from 5-tuple to `Player[]`
3. Add persist version migration:

```typescript
version: 2,
migrate: (persisted, version) => {
  if (version < 2) {
    const state = persisted as { teams: Team[] };
    state.teams = state.teams.map(t => ({ ...t, teamSize: 5 as TeamSize }));
  }
  return state;
},
```

#### `src/store/gameStore.ts`

1. `createGame`: derive matrix size from `team.teamSize`:

```typescript
matrix: Array(team.teamSize).fill(null).map(() => Array(team.teamSize).fill(10)),
```

### Files to Modify (Downstream Type Fixes)

After changing the types, TypeScript will flag errors in files that reference the old types. Fix these minimally:

- `src/pages/TeamSetupPage.tsx`: Remove the 5-tuple cast on line 90. Just use `players` directly.
- `src/pages/GameSetupPage.tsx`: `createDefaultPlayers()` call — may need to pass team size. For now, default 5 is fine since team selection hasn't been updated yet.
- Any other files that reference `[Player, Player, Player, Player, Player]` — change to `Player[]`.

### Verification

- `npm run build` — no TypeScript errors
- `npm run test:run` — all existing tests pass
- Existing 5v5 flow still works (manual check)

---

## Session 2: Algorithm Memoization & 8v8 Base Cases

**Goal**: Make the game-theory algorithm work for 8v8 with acceptable performance. Add memoization, handle the 2-player base case, and track refused/uninvolved players. After this session, `analyzeDefenderPhase` works correctly for 8-player arrays.

### Files to Modify

#### `src/algorithms/fullGameTheory.ts`

##### 2a. Add memoization cache

At the top of the file, after imports:

```typescript
// Memoization cache for game tree evaluation
// Key: sorted remaining player indices for both sides
// Value: payoff matrix + equilibrium solution
let memoCache: Map<
  string,
  {
    payoffMatrix: number[][];
    equilibrium: GameEquilibrium;
  }
> | null = null;

function getMemoKey(ourRemaining: number[], oppRemaining: number[]): string {
  return (
    [...ourRemaining].sort((a, b) => a - b).join(',') +
    '|' +
    [...oppRemaining].sort((a, b) => a - b).join(',')
  );
}

/** Initialize memo cache — call at start of pairing session */
export function initMemoCache(): void {
  memoCache = new Map();
}

/** Clear memo cache — call when resetting pairing session */
export function clearMemoCache(): void {
  memoCache = null;
}
```

##### 2b. Apply memoization to `buildDefenderPayoffMatrix`

After the `n === 1` base case check, add cache lookup:

```typescript
const key = getMemoKey(ourRemaining, oppRemaining);
const cached = memoCache?.get(key);
if (cached) return cached.payoffMatrix;
```

Before returning, cache the result:

```typescript
const equilibrium = solveZeroSumGame(payoffMatrix, ourRemaining, oppRemaining);
memoCache?.set(key, { payoffMatrix, equilibrium });
return payoffMatrix;
```

##### 2c. Use cache in `analyzeDefenderPhase`

After building the payoff matrix, check if the equilibrium was already cached:

```typescript
const key = getMemoKey(ourRemaining, oppRemaining);
const cached = memoCache?.get(key);
const equilibrium =
  cached?.equilibrium ?? solveZeroSumGame(payoffMatrix, ourRemaining, oppRemaining);
```

##### 2d. Add 2-player base case for 8v8 final round

In `buildDefenderPayoffMatrix`, after the `n === 1` check, add:

```typescript
// Special case: 2 players each — WTC 4v4 final round aftermath
// After the defender/attacker exchange in a 4v4, 2 remain per side:
// the refused attacker + the uninvolved player.
// These pair up: refused vs refused, uninvolved vs uninvolved.
// At this point in the recursion we don't know which is which,
// so we take the best pairing for us (game-theoretic optimal).
if (n === 2) {
  const option1 =
    matrix[ourRemaining[0]][oppRemaining[0]] + matrix[ourRemaining[1]][oppRemaining[1]];
  const option2 =
    matrix[ourRemaining[0]][oppRemaining[1]] + matrix[ourRemaining[1]][oppRemaining[0]];
  // In practice the pairing is determined by the exchange, not by choice.
  // But from the game tree perspective, the algorithm evaluates the expected
  // value, and the exchange mechanics determine which pairing actually occurs.
  // We return the average or the game-theoretically correct value.
  // Since both teams' refused attackers face each other, and remaining face
  // each other, the actual pairing depends on the exchange. But for the
  // payoff matrix (which evaluates defender choices), we need to know the
  // total future value from 2 remaining per side.
  // The correct approach: build a 2x2 payoff matrix (defender choices with
  // 2 players) where the exchange resolves everything.
  // For 2v2: each side picks a defender (2 options each = 2x2 matrix).
  // Each side has 1 attacker to send. The defender has no choice (only 1
  // attacker). The "refused" concept doesn't apply with 1 attacker.
  // So: defender matchup is forced (our defender vs their 1 attacker,
  //     their defender vs our 1 attacker).
  // This means the existing algorithm handles it correctly if we just
  // let it recurse normally for n=2. The n=1 base case catches the
  // recursion when it goes deeper.
  // ACTUALLY: for n=2, buildDefenderPayoffMatrix builds a 2x2 matrix.
  // Each cell: resolve exchange with 1 attacker each side.
  // resolveAttackerExchange with 1 attacker: sends that 1, defender
  // must accept (no refuse), remaining = 0. futureValue = 0.
  // So the existing code should work for n=2 WITHOUT a special case,
  // as long as resolveAttackerExchange handles 1-attacker correctly.
  // Let's verify: findOptimalAttackerPair with 1 attacker returns
  // [att, att] (same player twice). findWorstMatchups with 1 opponent
  // also handles it. The "refused" attacker concept breaks with 1.
  // CONCLUSION: The algorithm already handles n=2 correctly via recursion.
  // No special base case needed here.
}
```

**Wait — re-reading the code more carefully**: `resolveAttackerExchange` calls `findOptimalAttackerPair` which handles `oppAttackers.length <= 2` by returning `[oppAttackers[0], oppAttackers[1] ?? oppAttackers[0]]`. When there's only 1 attacker, it returns `[att, att]`. Then `findWorstMatchups` is called which handles small arrays. But with 1 attacker per side, the "send 2 attackers" concept doesn't work literally — each side only HAS 1 attacker. The current code handles this edge case gracefully through the `length <= 2` guards, but the scoring may be slightly off (it calculates as if 2 copies of the same attacker are sent).

For the n=2 case in the recursion (which represents 2v2 AFTER a 4v4 exchange), the exchange is: each side picks 1 defender from 2 players, the other is the sole attacker. There's only 1 attacker, no refuse step, 1 forced pairing. Then 0 remain. This is exactly what the recursion does naturally. **No special 2-player base case is needed in the algorithm itself.**

The special handling is needed in the **UI** (DefenderChooseContent) for the 4v4 round, where after the choose step we need to auto-lock the refused+uninvolved pairings. But the algorithm handles it.

##### 2e. Enhance `resolveAttackerExchange` return type

Add fields to track refused attackers (needed by DefenderChooseContent in session 5):

```typescript
interface PairingRoundResult {
  // ... existing fields ...
  ourRefusedAttacker: number; // Our attacker that opponent's defender refused
  oppRefusedAttacker: number; // Opponent's attacker that our defender refused
}
```

In `resolveAttackerExchange`, the refused attackers are the ones NOT chosen:

- `oppRefusedAttacker`: the opponent attacker our defender did NOT choose (the one with lower score for us)
- `ourRefusedAttacker`: our attacker their defender did NOT choose (the one with higher score for us, i.e., the one they refused)

```typescript
// Our defender chooses the better one (higher score for us)
const oppAttackerChosen = oppAtt1Score >= oppAtt2Score ? oppSentAttackers[0] : oppSentAttackers[1];
const oppRefusedAttacker = oppAtt1Score >= oppAtt2Score ? oppSentAttackers[1] : oppSentAttackers[0]; // NEW

// Their defender chooses the worse one for us (lower score)
const ourAttackerChosen = ourAtt1Score <= ourAtt2Score ? ourSentAttackers[0] : ourSentAttackers[1];
const ourRefusedAttacker = ourAtt1Score <= ourAtt2Score ? ourSentAttackers[1] : ourSentAttackers[0]; // NEW
```

##### 2f. Fix `numRemainingPairings` in `analyzeOpponentAttackerPhase`

Replace:

```typescript
const numRemainingPairings =
  newOurRemaining.length === 1 ? 2 : newOurRemaining.length === 0 ? 1 : 3;
```

With generic formula:

```typescript
const numRemainingPairings = 2 + newOurRemaining.length;
```

(2 for the current round's defender+attacker matchups, plus 1 for each remaining player pair in future rounds.)

#### `src/algorithms/__tests__/fullGameTheory.test.ts`

Add new test suite:

```typescript
describe('8v8 support', () => {
  beforeEach(() => initMemoCache());
  afterEach(() => clearMemoCache());

  it('should analyze defender phase for 8 players', () => {
    const matrix8 = /* 8x8 deterministic test matrix */;
    const result = analyzeDefenderPhase(matrix8, [0,1,2,3,4,5,6,7], [0,1,2,3,4,5,6,7]);
    expect(result.defenderAnalyses).toHaveLength(8);
  });

  it('should complete 8v8 analysis in under 5 seconds', () => {
    const matrix8 = /* 8x8 test matrix */;
    const start = performance.now();
    analyzeDefenderPhase(matrix8, [0,1,2,3,4,5,6,7], [0,1,2,3,4,5,6,7]);
    expect(performance.now() - start).toBeLessThan(5000);
  });

  it('balanced 8x8 matrix should give game value of 80', () => {
    const balanced = Array(8).fill(null).map(() => Array(8).fill(10));
    const result = analyzeDefenderPhase(balanced, [0,1,2,3,4,5,6,7], [0,1,2,3,4,5,6,7]);
    expect(result.gameValue).toBeCloseTo(80, 0);
  });

  it('memoization should make repeated calls near-instant', () => {
    const matrix8 = /* test matrix */;
    analyzeDefenderPhase(matrix8, [0,1,2,3,4,5,6,7], [0,1,2,3,4,5,6,7]);
    const start = performance.now();
    analyzeDefenderPhase(matrix8, [0,1,2,3,4,5,6,7], [0,1,2,3,4,5,6,7]);
    expect(performance.now() - start).toBeLessThan(50);
  });

  it('should handle intermediate states (6v6, 4v4, 2v2)', () => {
    const matrix8 = /* test matrix */;
    expect(() => analyzeDefenderPhase(matrix8, [0,1,2,3,4,5], [2,3,4,5,6,7])).not.toThrow();
    expect(() => analyzeDefenderPhase(matrix8, [0,1,2,3], [4,5,6,7])).not.toThrow();
    expect(() => analyzeDefenderPhase(matrix8, [0,1], [6,7])).not.toThrow();
  });
});
```

Also add `initMemoCache()`/`clearMemoCache()` to existing test setup/teardown (memoization is optional for 5v5 but shouldn't break anything).

### Verification

- `npm run test:run` — all tests pass including new 8v8 tests
- `npm run build` — no errors
- Performance: 8v8 `analyzeDefenderPhase` completes in < 5 seconds

---

## Session 3: Pairing Store Refactor

**Goal**: Replace the hardcoded `round1`/`round2` state with a dynamic `rounds[]` array. Replace 8 named setters with 4 generic ones. After this session, the pairing store supports any number of selection rounds.

**Important**: This session will temporarily break the UI (content components still reference `round1`/`round2` and named setters). The UI is fixed in Session 5.

### Files to Modify

#### `src/store/pairingStore.ts`

##### 3a. Change state shape

Replace:

```typescript
round1: RoundSelectionState;
round2: RoundSelectionState;
```

With:

```typescript
teamSize: TeamSize;
rounds: RoundSelectionState[];  // length = getSelectionRoundCount(teamSize)
```

##### 3b. Replace named setters with generic ones

Remove all 8 named setters. Add 4 generic setters + 1 accessor:

```typescript
setOurDefender: (round: number, player: Player) => void;
setOppDefender: (round: number, player: Player) => void;
setOurAttackers: (round: number, players: [Player, Player]) => void;
setOppAttackers: (round: number, players: [Player, Player]) => void;
getRound: (round: number) => RoundSelectionState;
```

Implementation pattern:

```typescript
setOurDefender: (round, player) => {
  set((state) => {
    const rounds = [...state.rounds];
    rounds[round - 1] = { ...rounds[round - 1], ourDefender: player };
    return { rounds };
  });
},

getRound: (round) => {
  return get().rounds[round - 1] ?? {
    ourDefender: null, oppDefender: null,
    ourAttackers: null, oppAttackers: null,
  };
},
```

##### 3c. Update `choosePairing` signature

Change `round: 1 | 2 | 3` to `round: number`.

##### 3d. Update `initializeFromGame`

Read `teamSize` from the game's team, create the correct number of round states:

```typescript
initializeFromGame: (gameId) => {
  const game = useGameStore.getState().getGame(gameId);
  if (!game) return false;
  const teamSize = game.ourTeam.teamSize ?? 5;
  const roundCount = getSelectionRoundCount(teamSize);
  set({
    gameId,
    matrix: { ... },
    phase: 'matrix-entry',
    teamSize,
    rounds: Array.from({ length: roundCount }, () => ({ ...initialRoundState })),
    pairings: [],
    ourRemaining: [...game.ourTeam.players],
    oppRemaining: [...game.opponentPlayers],
  });
  return true;
},
```

##### 3e. Update `advancePhase`

Use dynamic phase order:

```typescript
advancePhase: () => {
  const { phase, teamSize } = get();
  const order = generatePhaseOrder(teamSize);
  const currentIndex = order.indexOf(phase);
  if (currentIndex < order.length - 1) {
    set({ phase: order[currentIndex + 1] });
  }
},
```

##### 3f. Update persistence

```typescript
partialize: (state) => ({
  gameId: state.gameId,
  phase: state.phase,
  teamSize: state.teamSize,
  rounds: state.rounds,
  pairings: state.pairings,
}),
```

Add migration:

```typescript
version: 2,
migrate: (persisted, version) => {
  if (version < 2) {
    const old = persisted as any;
    return {
      ...old,
      teamSize: 5,
      rounds: [
        old.round1 ?? initialRoundState,
        old.round2 ?? initialRoundState,
      ],
    };
  }
  return persisted;
},
```

##### 3g. Update `rebuildFromGame`

Add `teamSize` to the rebuild:

```typescript
function rebuildFromGame(gameId, pairings) {
  // ... existing logic ...
  const teamSize = game.ourTeam.teamSize ?? 5;
  return { matrix, ourRemaining, oppRemaining, teamSize };
}
```

And in `onRehydrateStorage`:

```typescript
const { matrix, ourRemaining, oppRemaining, teamSize } = rebuildFromGame(...);
state.matrix = matrix;
state.ourRemaining = ourRemaining;
state.oppRemaining = oppRemaining;
if (teamSize) state.teamSize = teamSize;
```

### Verification

- `npm run build` — may have type errors in UI files that still reference old setters. This is expected and will be fixed in Session 5. Fix any errors in store files and algorithm files.
- `npm run test:run` — store tests pass (if any exist), algorithm tests pass

---

## Session 4: UI — Team Setup, Game Setup, Matrix, Summary

**Goal**: Update the team creation and game setup UI to support selecting 5 or 8 players. Update matrix entry and game summary to handle dynamic sizes. After this session, users can create 8-player teams and enter 8x8 matrices.

### Files to Modify

#### `src/pages/TeamSetupPage.tsx`

1. Add team size state and selector:

```typescript
const [teamSize, setTeamSize] = useState<TeamSize>(existingTeam?.teamSize ?? 5);
```

2. Add a toggle/segmented control before the players section:

```tsx
<div className="flex gap-2">
  <button
    className={`flex-1 min-h-[44px] rounded-lg border ${teamSize === 5 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-600'}`}
    onClick={() => {
      setTeamSize(5);
      setPlayers(createDefaultPlayers(5));
    }}
    disabled={isEditMode}
  >
    5 Players (UKTC)
  </button>
  <button
    className={`flex-1 min-h-[44px] rounded-lg border ${teamSize === 8 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-600'}`}
    onClick={() => {
      setTeamSize(8);
      setPlayers(createDefaultPlayers(8));
    }}
    disabled={isEditMode}
  >
    8 Players (WTC)
  </button>
</div>
```

3. Remove the 5-tuple cast. Pass `teamSize` to `createTeam()`:

```typescript
createTeam({ teamName: teamName.trim(), teamSize, players });
```

4. In the `useEffect` init, use team's size:

```typescript
setPlayers(createDefaultPlayers(existingTeam?.teamSize ?? 5));
```

#### `src/pages/GameSetupPage.tsx`

1. When initializing opponent players, use the selected team's size:

```typescript
const teamSize = selectedTeam?.teamSize ?? 5;
const [opponentPlayers, setOpponentPlayers] = useState<Player[]>(createDefaultPlayers(teamSize));
```

2. When team selection changes, regenerate opponent players:

```typescript
useEffect(() => {
  if (selectedTeam) {
    setOpponentPlayers(createDefaultPlayers(selectedTeam.teamSize));
  }
}, [selectedTeam?.id]);
```

#### `src/pages/MatrixEntryPage.tsx`

1. Replace `matrix?.length === 5` with dynamic check
2. Replace `Array(5).fill(...)` with `Array(teamSize).fill(...)` where `teamSize = game.ourTeam.teamSize`

#### `src/pages/GameSummaryPage.tsx`

1. Replace `sessionPairings.length === 5` with:

```typescript
const expectedPairings = game?.ourTeam.teamSize ?? 5;
const isFromSession = sessionGameId === id && sessionPairings.length === expectedPairings;
```

#### `src/components/Display/MatchupPreview.tsx`

1. Widen `round` prop from `1 | 2 | 3` to `number`

#### `src/components/Display/EVBadge.tsx` (and callers)

1. Ensure `totalPairings` prop is passed correctly for 8v8 contexts (default is 5)

### Verification

- `npm run build` — passes
- Create an 8-player team in the UI
- Create a game with that team — 8x8 matrix appears
- Enter scores in 8x8 matrix
- 5v5 teams still work normally

---

## Session 5: UI — Pairing Flow (Dynamic Rounds)

**Goal**: Make the entire pairing flow work dynamically for any number of rounds. This is the largest UI session. After this session, the full 8v8 pairing flow works end-to-end.

### Files to Modify

#### `src/pages/PairingPhasePage.tsx`

1. Replace hardcoded `phaseRound` record with a function:

```typescript
function getPhaseRound(phase: string): number | undefined {
  const match = phase.match(/^(?:defender|attacker)-(\d+)-/);
  return match ? parseInt(match[1], 10) : undefined;
}
```

2. Replace hardcoded `phaseTitles` with a function:

```typescript
function getPhaseTitle(phase: string): string {
  const round = getPhaseRound(phase);
  if (phase === 'final-pairing') return 'Final Pairing';
  if (!round) return 'Pairing';
  if (phase.endsWith('-select') && phase.startsWith('defender'))
    return `Round ${round}: Select Defender`;
  if (phase.endsWith('-reveal') && phase.startsWith('defender'))
    return `Round ${round}: Reveal Defenders`;
  if (phase.endsWith('-select') && phase.startsWith('attacker'))
    return `Round ${round}: Select Attackers`;
  if (phase.endsWith('-reveal') && phase.startsWith('attacker'))
    return `Round ${round}: Reveal Attackers`;
  if (phase.endsWith('-choose')) return `Round ${round}: Defender Chooses`;
  return 'Pairing';
}
```

3. Replace hardcoded `previousPhaseMap` with `generatePreviousPhaseMap(teamSize)` (read `teamSize` from pairing store)

4. Replace `switch` in `renderContent()` with pattern matching:

```typescript
const renderContent = () => {
  const round = getPhaseRound(currentPhase);
  if (round && currentPhase.startsWith('defender-') && currentPhase.endsWith('-select'))
    return <DefenderSelectContent round={round} onNext={goToPhase} />;
  if (round && currentPhase.startsWith('defender-') && currentPhase.endsWith('-reveal'))
    return <DefenderRevealContent round={round} onNext={goToPhase} />;
  // ... etc for all 5 phase types ...
  if (currentPhase === 'final-pairing')
    return <FinalPairingContent onComplete={goToSummary} />;
  return <div>Unknown phase</div>;
};
```

#### All 5 content components — same pattern:

**For each of `DefenderSelectContent`, `DefenderRevealContent`, `AttackerSelectContent`, `AttackerRevealContent`, `DefenderChooseContent`:**

1. Change `round: 1 | 2` to `round: number` in props interface
2. Replace `round1.ourDefender` / `round2.ourDefender` with `getRound(round).ourDefender` (using the new store accessor)
3. Replace named setters (`setOurDefender1(p)`) with generic (`setOurDefender(round, p)`)
4. Replace hardcoded next-phase strings with template literals:
   - `onNext('defender-1-reveal')` → ``onNext(`defender-${round}-reveal` as Phase)``
   - `onNext('attacker-1-select')` → ``onNext(`attacker-${round}-select` as Phase)``

#### `DefenderSelectContent` — add loading spinner:

For 8v8, the algorithm takes a few seconds on first call:

```typescript
const [isComputing, setIsComputing] = useState(false);
const [result, setResult] = useState<DefenderPhaseResult | null>(null);

useEffect(() => {
  if (!matrix) return;
  const indices = ourRemaining.map((p) => p.index);
  const oppIndices = oppRemaining.map((p) => p.index);

  if (teamSize > 5 && round === 1) {
    setIsComputing(true);
    const timer = setTimeout(() => {
      initMemoCache();
      setResult(analyzeDefenderPhase(matrix.scores, indices, oppIndices));
      setIsComputing(false);
    }, 0);
    return () => clearTimeout(timer);
  }

  setResult(analyzeDefenderPhase(matrix.scores, indices, oppIndices));
}, [matrix, ourRemaining, oppRemaining]);
```

Spinner UI:

```tsx
{
  isComputing && (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      <span className="text-sm text-gray-500">Analyzing matchups...</span>
    </div>
  );
}
```

#### `DefenderChooseContent` — handle 4v4 final round:

This is the most complex change. After locking the 2 standard pairings in the final selection round (round 3 for 8v8), 2 players remain per side. The refused attackers and uninvolved players must be auto-paired.

```typescript
const handleConfirm = () => {
  if (!ourChoice || !oppChoice) return;

  // Lock standard pairings (same as existing)
  choosePairing(ourDefender, ourChoice, round); // Our defender vs their accepted attacker
  choosePairing(oppChoice, oppDefender, round); // Their defender vs our accepted attacker

  const teamSize = usePairingStore.getState().teamSize;
  const selectionRounds = getSelectionRoundCount(teamSize);

  if (round < selectionRounds) {
    // More selection rounds to go
    onNext(`defender-${round + 1}-select` as Phase);
  } else if (isFinalSelectionRound(teamSize, round) && teamSize === 8) {
    // 8v8 final round: auto-lock refused + uninvolved pairings
    // After choosePairing removed 2 from each side, 2 remain per side
    const state = usePairingStore.getState();
    const remaining = state.ourRemaining; // Should be 2 players
    const oppRem = state.oppRemaining; // Should be 2 players

    if (remaining.length === 2 && oppRem.length === 2) {
      // Determine who is "refused" vs "uninvolved"
      // The refused attacker is the one from oppAttackers that we did NOT choose
      const ourRefused = ourAttackers.find((a) => a.id !== oppChoice.id);
      const oppRefused = oppAttackers.find((a) => a.id !== ourChoice.id);

      // The uninvolved player is the remaining one who was NOT an attacker
      const ourUninvolved = remaining.find((p) => p.id !== ourRefused?.id);
      const oppUninvolved = oppRem.find((p) => p.id !== oppRefused?.id);

      if (ourRefused && oppRefused) {
        choosePairing(ourRefused, oppRefused, round); // Game 7: refused vs refused
      }
      if (ourUninvolved && oppUninvolved) {
        choosePairing(ourUninvolved, oppUninvolved, round); // Game 8: remaining vs remaining
      }
    }

    onNext('final-pairing');
  } else {
    // 5v5 final (round 2 → final-pairing with 1v1)
    onNext('final-pairing');
  }
};
```

Button text update:

```typescript
<Button ...>
  {isFinalSelectionRound(teamSize, round)
    ? `Lock ${teamSize === 8 ? '4' : '2 More'} Pairings`
    : round === 1
      ? 'Lock 2 Pairings'
      : 'Lock 2 More Pairings'}
</Button>
```

#### `FinalPairingContent` — handle both 5v5 and 8v8:

```typescript
const { ourRemaining, oppRemaining, pairings, teamSize, ... } = usePairingStore();

if (ourRemaining.length === 1 && oppRemaining.length === 1) {
  // 5v5: existing forced 1v1 pairing behavior
  // ... existing code ...
} else if (ourRemaining.length === 0 && oppRemaining.length === 0) {
  // 8v8: all pairings already locked by DefenderChooseContent
  // Show confirmation summary of all 8 pairings
  // No new pairings to lock — just show the total and "Complete" button
}
```

Update the neutral score text:

```typescript
<div>(Neutral = {teamSize * 10} points)</div>
```

#### `src/components/Layout/PhaseIndicator.tsx`

Generate phases dynamically:

```typescript
import { usePairingStore } from '@/store/pairingStore';
import { generatePairingPhases } from '@/store/types';

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const teamSize = usePairingStore((s) => s.teamSize);
  const pairingPhases = generatePairingPhases(teamSize);

  function getPhaseLabel(phase: Phase): string {
    if (phase === 'final-pairing') return 'Final';
    const match = (phase as string).match(/^(defender|attacker)-(\d+)-(select|reveal|choose)$/);
    if (!match) return '';
    const [, type, round, action] = match;
    if (action === 'select') return type === 'defender' ? `Def ${round}` : `Att ${round}`;
    if (action === 'reveal') return 'Reveal';
    if (action === 'choose') return 'Choose';
    return '';
  }

  // ... rest same as current, using dynamic pairingPhases ...
}
```

### Verification

- `npm run build` — passes
- `npm run test:run` — passes
- Full 5v5 flow works as before
- Full 8v8 flow: 3 selection rounds + final → all 8 pairings appear in summary
- Loading spinner appears during 8v8 round 1 defender analysis
- Back navigation works correctly through all phases
- Phase indicator shows correct progress for both sizes

---

## Session 6: Polish, Methodology & Final Testing

**Goal**: Update explanatory text, fix EVBadge scoring for 8v8, comprehensive testing, and any remaining polish.

### Files to Modify

#### `src/pages/MethodologyPage.tsx`

- Update "all three rounds" → "all rounds"
- Add note about WTC 8-player format
- Update backward induction explanation to cover both 5v5 and 8v8

#### `src/components/Display/AdvancedMathSection.tsx`

- Update complexity table to show both 5v5 and 8v8
- Update "Round 1 (5v5): 5x5 payoff matrix" references

#### EVBadge callers across pairing content components

- Ensure `totalPairings` is passed as `teamSize` wherever EVBadge is used
- Check `DefenderSelectContent`, `DefenderCard`, `AttackerPairCard`, `FinalPairingContent`

#### Persistence test

- Start an 8v8 pairing, advance to mid-flow
- Close browser, reopen
- "Resume Pairing" should return to correct phase with data intact

### Final Verification Checklist

- [ ] `npm run build` — no errors
- [ ] `npm run test:run` — all tests pass
- [ ] Create 5-player team → full pairing flow → summary (regression)
- [ ] Create 8-player team → full pairing flow → summary
- [ ] 8v8 round 3: 4 pairings locked correctly (2 standard + refused + uninvolved)
- [ ] Loading spinner shows on 8v8 round 1
- [ ] Phase indicator shows 16 phases for 8v8
- [ ] Back navigation works for all 8v8 phases
- [ ] Mid-session persistence works for 8v8
- [ ] EVBadge shows correct coloring for 8-pairing totals
- [ ] 8x8 matrix entry is usable (scrolls correctly)
- [ ] Game summary shows all 8 pairings with correct round numbers

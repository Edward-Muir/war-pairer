# Nash Equilibrium Algorithm Testing

## Overview

This document describes the test suite for validating the full game-theoretic pairing algorithm. The tests verify that the Nash equilibrium solver and backward induction correctly identify optimal strategies.

## Test Location

All tests are in: `src/algorithms/__tests__/fullGameTheory.test.ts`

Run with: `npm run test:run`

## Test Categories

### 1. Obvious Dominance Cases

These tests verify the algorithm makes correct choices in scenarios where the optimal decision is clear-cut.

#### 1.1 Dominant Defender Selection
**Scenario**: Player 0 scores 17-18 against all opponents; all other players score 10.

**Expected**: Player 0 should be recommended as optimal defender.

```typescript
const dominantDefenderMatrix = [
  [17, 18, 17, 18, 17], // Player 0 - dominant
  [10, 10, 10, 10, 10], // Players 1-4
  ...
]
```

#### 1.2 Dominated Defender Avoidance
**Scenario**: Player 4 scores 0 against everyone (completely useless).

**Expected**: Player 4 should NOT be marked as optimal, and their `defenderScore` should be 0.

#### 1.3 Saddle Point Detection
**Scenario**: Matrix designed with a clear saddle point at (0,0) with value 8.

**Expected**: `solveZeroSumGame` returns `isPure: true` and `value: 8`.

#### 1.4 Attacker Pair Dominance
**Scenario**: Three attackers available against opponent's defender:
- Player 2 scores 15
- Player 3 scores 14
- Player 4 scores 8

**Expected**: Pair [2,3] is optimal (min=14 beats min=8 from other pairs).

#### 1.5 Weak Attacker Avoidance
**Scenario**: Player 4 scores only 2 against opponent's defender while others score 15-16.

**Expected**: Optimal pair excludes Player 4.

### 2. Monte Carlo Simulation

Tests the algorithm's effectiveness against a random opponent over many games.

#### Setup: Balanced Matrix Generation

To ensure fair games, matrices are generated with symmetric balance:

```typescript
function generateBalancedMatrix(): number[][] {
  const matrix = Array(5).fill(null).map(() => Array(5).fill(10))

  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      const score = Math.floor(Math.random() * 21) // 0-20
      matrix[i][j] = score
      matrix[j][i] = 20 - score // Symmetric complement
    }
    matrix[i][i] = 10 // Diagonal is neutral
  }
  return matrix
}
```

**Key property**: If `matrix[i][j] = X`, then `matrix[j][i] = 20 - X`. This means:
- If our Player A is good against their Player B, their Player B is equally bad against our Player A
- Total expected value is 50 for both teams with random play
- No inherent advantage to either side - only strategy matters

#### Simulation Flow

Each simulated game follows the UKTC pairing process:

```
Round 1 (5v5):
  - Algorithm picks optimal defender via analyzeDefenderPhase()
  - Opponent picks random defender
  - Algorithm picks optimal attacker pair via analyzeAttackerPhase()
  - Opponent picks random attacker pair
  - Defenders choose which attacker to face (us: max score, them: min for us)
  - 2 players paired off each side

Round 2 (3v3):
  - Same process with remaining 3 players each
  - 2 more players paired off each side

Round 3 (1v1):
  - Forced matchup between last remaining players
```

#### Success Criteria

| Test | Threshold | Typical Result |
|------|-----------|----------------|
| Win rate | > 55% | 65-68% |
| Average score | Us > Opponent | ~56-58 vs ~42-44 |

**Results from test runs**:
- Win rate: 65-68% (well above 55% threshold)
- Average scores: ~56-58 (us) vs ~42-44 (opponent)
- This demonstrates ~10-15 point advantage per game from optimal play

## Future Work: Interactive Testing Mode

### Purpose
Allow a human to play against the algorithm to:
1. Verify the algorithm "feels" correct
2. Test edge cases the human discovers
3. Build intuition about optimal play

### Suggested Implementation

Create a mode where:
1. Human acts as the opponent team captain
2. Algorithm acts as our team captain
3. UI shows both teams' remaining players and the matchup matrix

#### Flow for Interactive Mode

```
Round 1:
  1. Show matrix to human
  2. Human selects their defender (hidden from algorithm display)
  3. Algorithm selects optimal defender (shown after human commits)
  4. Reveal both defenders
  5. Human selects 2 attackers to send
  6. Algorithm selects optimal 2 attackers
  7. Each defender chooses which attacker to face
  8. Display pairings and scores

Round 2: Same with remaining 3 players each
Round 3: Forced final matchup
```

#### Key UI Elements Needed

1. **Matrix view**: Show the 5x5 matchup scores
2. **Player selection**: Let human pick defender and attacker pairs
3. **Hidden selection**: Human's choice shouldn't influence algorithm (prevent cheating)
4. **Score tracker**: Running total for both teams
5. **Round summary**: Show which players were paired and scores

#### API for Interactive Mode

The existing algorithm functions support this directly:

```typescript
// Get algorithm's defender choice
const defResult = analyzeDefenderPhase(matrix, ourRemaining, oppRemaining)
const algorithmDefender = defResult.defenderAnalyses[0].playerIndex

// After both defenders revealed, get algorithm's attacker pair
const atkResult = analyzeAttackerPhase(
  matrix,
  algorithmDefender,
  humanDefender,
  ourAttackers,
  oppAttackers
)
const algorithmPair = atkResult[0].attackers
```

#### Scoring Logic

```typescript
// Our defender chooses best of human's pair
const ourDefScore = Math.max(
  matrix[ourDefender][humanPair[0]],
  matrix[ourDefender][humanPair[1]]
)

// Their defender (human) chooses worst for us from our pair
const ourAtkScore = Math.min(
  matrix[ourPair[0]][humanDefender],
  matrix[ourPair[1]][humanDefender]
)

// Human scores the inverse (zero-sum)
humanScore += (20 - ourDefScore) + (20 - ourAtkScore)
```

### Testing Hypotheses

When building interactive mode, test these scenarios:

1. **Can human beat algorithm by exploiting patterns?**
   - Algorithm uses pure minimax, might be predictable

2. **Does algorithm handle "traps"?**
   - Human intentionally picks weak defender to bait bad attacker choice

3. **Round 2/3 cascades**
   - Does a "bad" round 1 choice doom the algorithm, or does it recover?

4. **Balanced vs unbalanced matrices**
   - Algorithm should dominate on balanced, but what about skewed matrices?

## Files Reference

| File | Purpose |
|------|---------|
| `src/algorithms/fullGameTheory.ts` | Core algorithm implementation |
| `src/algorithms/__tests__/fullGameTheory.test.ts` | Test suite (68 tests) |
| `documentation/full-game-theory-algorithm.md` | Algorithm specification |
| `documentation/nash-equilibrium-testing.md` | This document |

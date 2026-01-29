# Full Game-Theoretic Pairing Algorithm

## Overview

This document describes the implementation of a complete game-theoretic algorithm for the UKTC pairing process. The algorithm uses **backward induction** with **Nash equilibrium** computation to find optimal strategies considering both teams' simultaneous defender choices.

## The Problem

The UKTC pairing process is a **two-player zero-sum game** with three rounds:

| Round | Players Each | Process | Pairings Locked |
|-------|--------------|---------|-----------------|
| 1 | 5 | Both pick defender → Both send 2 attackers → Defenders choose | 2 |
| 2 | 3 | Same process | 2 |
| 3 | 1 | Forced matchup | 1 |

**Key insight**: On a 0-20 scoring scale, if we score X, opponent scores (20-X). This makes it a zero-sum game where minimax = Nash equilibrium.

## Previous Implementation (Greedy)

The old algorithm used simple one-round lookahead:

- **Defender Score** = second-lowest value in player's row (guaranteed minimum if opponent sends optimal attackers)
- **Attacker Pair Score** = minimum of the two attackers' scores (opponent picks the worse one for us)

**Problem**: This ignores future rounds. Choosing defender A might give 10 points now but leave terrible options for rounds 2-3.

## New Implementation (Full Backward Induction)

### Core Concept

Solve the game tree from the end backwards:

1. **Round 3**: Trivial - one forced matchup, just look up the score
2. **Round 2**: For each possible 3v3 state, find optimal play knowing round 3
3. **Round 1**: For each possible 5v5 choice, find optimal play knowing rounds 2-3

### Simultaneous Defender Selection

Both teams choose defenders simultaneously before reveal. This creates a **payoff matrix**:

```
payoffMatrix[ourDefender][oppDefender] = total expected score for us
```

For a 5v5 round, this is a 5×5 matrix. We find the **Nash equilibrium** (or minimax for zero-sum games) to determine the optimal strategy.

## Algorithm Components

### 1. `analyzeDefenderPhase(matrix, ourRemaining, oppRemaining)`

**Main entry point** for defender selection screens.

**Returns**:
- `gameValue`: Expected total score with optimal play from both sides
- `payoffMatrix`: Full NxN matrix of outcomes
- `defenderAnalyses`: Ranked list of defender options with both simple `defenderScore` and full `gameValue`
- `equilibrium`: Nash equilibrium solution (pure or mixed strategy)

**Process**:
1. Build payoff matrix for all defender combinations
2. Solve for Nash equilibrium
3. Compute both simple and full metrics for each defender
4. Sort by game value (minimax) descending

### 2. `analyzeAttackerPhase(matrix, ourDefender, oppDefender, ourAvailable, oppAvailable)`

**Entry point** for attacker selection after defenders are revealed.

**Returns**: Ranked list of attacker pairs with:
- `expectedScore`: Immediate score from this pairing
- `totalExpectedValue`: Score including all future rounds
- `forcedMatchup`: Which attacker opponent will choose to face
- `isOptimal`: Whether this is the best choice

**Process**:
1. Generate all C(n,2) attacker pairs
2. For each pair, determine which attacker opponent chooses (min score for us)
3. Recursively evaluate remaining game state
4. Sort by total expected value descending

### 3. `buildDefenderPayoffMatrix(matrix, ourRemaining, oppRemaining)`

Constructs the payoff matrix for simultaneous defender selection.

**For each cell (i,j)**:
1. Resolve attacker exchange assuming we defend with player i, they defend with player j
2. Determine which players get paired this round
3. Recursively evaluate remaining players
4. Cell value = this round score + future value

### 4. `resolveAttackerExchange(matrix, ourDefender, oppDefender, ourAttackers, oppAttackers)`

Determines optimal attacker exchanges after defenders are known.

**Process**:
1. Opponent sends their 2 best attackers against our defender (lowest scores for us)
2. We send our 2 best attackers against their defender (maximize min score)
3. Our defender chooses the better of the 2 sent against them (max for us)
4. Their defender chooses the better of our 2 (min for us)

**Returns**: Scores and which players got paired

### 5. `solveZeroSumGame(payoffMatrix, ourChoices, oppChoices)`

Finds Nash equilibrium for the zero-sum matrix game.

**Process**:
1. Check for **saddle point** (pure strategy equilibrium):
   - A cell that is minimum in its row AND maximum in its column
2. If no saddle point, compute **maximin** value (most robust pure strategy)
3. Return game value and optimal strategy

## Data Flow Example

### Round 1 Defender Selection

```
User opens Defender Select screen
    ↓
analyzeDefenderPhase(matrix, [0,1,2,3,4], [0,1,2,3,4])
    ↓
buildDefenderPayoffMatrix() builds 5×5 matrix:
    For each (ourDef, oppDef) pair:
        ↓
        resolveAttackerExchange() determines round 1 pairings
        ↓
        Recursive call for round 2 (3v3):
            buildDefenderPayoffMatrix() builds 3×3 matrix
                ↓
                For each pair, resolveAttackerExchange()
                ↓
                Recursive call for round 3 (1v1): direct lookup
        ↓
        Cell value = round1 + round2 + round3
    ↓
solveZeroSumGame() finds optimal strategy
    ↓
Return ranked defender options with gameValue and defenderScore
```

### Round 1 Attacker Selection (after defenders revealed)

```
User opens Attacker Select screen (defenders known)
    ↓
analyzeAttackerPhase(matrix, ourDefender, oppDefender, [remaining], [remaining])
    ↓
For each attacker pair:
    Calculate immediate score (min of pair)
    ↓
    Determine remaining players after this round
    ↓
    Recursive analyzeDefenderPhase() for round 2
    ↓
    Total = immediate + future
    ↓
Sort by totalExpectedValue
```

## Complexity Analysis

| Round | Defender Choices | Attacker Pairs | Recursive Calls |
|-------|------------------|----------------|-----------------|
| 1 (5v5) | 5 × 5 = 25 | C(4,2) = 6 | → Round 2 |
| 2 (3v3) | 3 × 3 = 9 | C(2,2) = 1 | → Round 3 |
| 3 (1v1) | 1 | - | Base case |

**Total operations**: ~25 × 6 × 9 × 1 ≈ **1,350** (instant on any device)

## Key Types

```typescript
interface FullDefenderAnalysis {
  playerIndex: number
  defenderScore: number      // Simple metric (second-lowest)
  worstMatchups: [number, number]
  gameValue: number          // Full backward induction result
  isOptimal: boolean
  worstCaseValue: number     // Min across all opponent choices
  bestCaseValue: number      // Max across all opponent choices
}

interface FullAttackerAnalysis {
  attackers: [number, number]
  expectedScore: number      // Immediate score
  forcedMatchup: number      // Who opponent will choose
  refusedAttacker: number    // Who returns to our pool
  totalExpectedValue: number // Including future rounds
  isOptimal: boolean
}

interface GameEquilibrium {
  value: number              // Game value with optimal play
  ourStrategy: Strategy      // Pure or mixed
  oppStrategy: Strategy
  isPure: boolean            // Whether pure equilibrium exists
}
```

## UI Integration

### DefenderSelectContent

Uses `analyzeDefenderPhase()` and displays:
- **Game Value** (prominent): Total expected score from full tree
- **Defender Score** (secondary): Simple metric for intuition
- **Game value with optimal play**: Header showing overall expected outcome

### AttackerSelectContent

Uses `analyzeAttackerPhase()` and displays:
- **Total Expected Value** (prominent): Including future rounds
- **This Round** (secondary): Immediate pairing score

## Files

| File | Purpose |
|------|---------|
| `src/algorithms/fullGameTheory.ts` | Core algorithm implementation |
| `src/algorithms/__tests__/fullGameTheory.test.ts` | 29 test cases |
| `src/components/Cards/DefenderCard.tsx` | Updated to show both metrics |
| `src/components/Cards/AttackerPairCard.tsx` | Updated to show total expected |
| `src/pages/pairing/DefenderSelectContent.tsx` | Uses new algorithm |
| `src/pages/pairing/AttackerSelectContent.tsx` | Uses new algorithm |

## Testing

The test suite covers:
- Payoff matrix construction
- Attacker exchange resolution
- Nash equilibrium solver (saddle points, maximin)
- Full game analysis integration
- Edge cases (1 player each, 2 attackers only)
- Zero-sum property verification

Run tests with: `npm run test:run`

## Future Enhancements

1. **Mixed Strategy Display**: Show probability distributions when no pure equilibrium exists
2. **Payoff Matrix Visualization**: Optional advanced view showing full matrix
3. **Sensitivity Analysis**: Show how robust recommendations are to opponent choices
4. **What-If Mode**: Let users explore different scenarios

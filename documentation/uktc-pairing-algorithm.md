# UKTC Optimal Pairing Algorithm

## Overview

This document describes the optimal algorithm for the UKTC pairing process using **backward induction** with **game tree evaluation**. This approach considers the full consequences of each decision across all three pairing rounds, not just the immediate round.

---

## 1. The Pairing Process Recap

The UKTC pairing has three rounds:

| Round | Our Players | Opp Players | Decisions |
|-------|-------------|-------------|-----------|
| 1 | 5 | 5 | Both pick defender → Both send 2 attackers → Defenders choose |
| 2 | 3 | 3 | Both pick defender → Both send 2 attackers (forced) → Defenders choose |
| 3 | 1 | 1 | Forced matchup |

Each round locks in **2 pairings** (one from each defender's choice), except Round 3 which locks the final **1 pairing**.

---

## 2. Why Simple "Defender Score" Isn't Enough

The simple approach calculates each player's "Defender Score" as the **second-lowest value in their row** (the best you can guarantee when opponent sends optimal counters).

**Problem**: This ignores downstream effects. Choosing Defender A might give you a score of 10 now, but leave you with terrible options for Rounds 2-3. Choosing Defender B might give you 9 now, but unlock a total of +5 across the remaining rounds.

**Solution**: Evaluate the **entire game tree** and choose the path that maximises **total expected score**.

---

## 3. Algorithm: Backward Induction

### 3.1 Core Principle

Solve the game from the end backwards:

1. **Round 3**: Trivial — one forced matchup, just look up the score
2. **Round 2**: For each possible 3v3 state, find optimal defender knowing Round 3
3. **Round 1**: For each possible 5v5 choice, find optimal defender knowing Rounds 2-3

### 3.2 Key Assumptions

At each defender selection, we assume:

1. **Opponent sends optimal attackers**: The 2 players that minimise your best-case score
2. **You choose optimally**: You pick the better of the 2 attackers to face
3. **Subsequent play is optimal**: Both sides play perfectly in future rounds

### 3.3 Simplification: Our Defender Only

The full game is complex because **both teams choose defenders simultaneously**. For a practical implementation, we simplify by assuming:

- We control our defender choice
- Opponent's defender choice is handled separately (we input it after the reveal)
- We then optimise our attacker selection against their revealed defender

This means we solve **two separate sub-problems** per round:
1. "Who should we defend with?" (before reveal)
2. "Who should we attack with?" (after opponent's defender is revealed)

---

## 4. Data Structures

```typescript
// The matchup matrix: matrix[ourPlayer][oppPlayer] = expected score for us
type Matrix = number[][];

// Indices of players still available
type PlayerPool = number[];

// A single pairing result
interface Pairing {
  ourPlayer: number;
  oppPlayer: number;
  score: number;
}

// Result of evaluating a game state
interface EvaluationResult {
  totalScore: number;      // Sum of all pairing scores from this point forward
  pairings: Pairing[];     // The pairings that achieve this score
  bestDefender?: number;   // Recommended defender (for defender selection phases)
}
```

---

## 5. Core Algorithm Implementation

### 5.1 Main Recursive Function

```typescript
/**
 * Evaluate the best total score achievable from a given game state.
 * Uses backward induction - recursively solves future rounds first.
 * 
 * @param matrix - The 5x5 matchup matrix
 * @param ourRemaining - Indices of our available players
 * @param oppRemaining - Indices of opponent's available players
 * @returns Best achievable total score and the pairings to achieve it
 */
function evaluateDefenderChoice(
  matrix: Matrix,
  ourRemaining: PlayerPool,
  oppRemaining: PlayerPool
): EvaluationResult {
  
  // BASE CASE: Only 1 player each = Round 3 forced pairing
  if (ourRemaining.length === 1) {
    const score = matrix[ourRemaining[0]][oppRemaining[0]];
    return {
      totalScore: score,
      pairings: [{ 
        ourPlayer: ourRemaining[0], 
        oppPlayer: oppRemaining[0], 
        score 
      }]
    };
  }
  
  let bestResult: EvaluationResult = { 
    totalScore: -Infinity, 
    pairings: [],
    bestDefender: ourRemaining[0]
  };
  
  // Try each of our remaining players as defender
  for (const defender of ourRemaining) {
    const result = evaluateAsDefender(matrix, defender, ourRemaining, oppRemaining);
    
    if (result.totalScore > bestResult.totalScore) {
      bestResult = {
        ...result,
        bestDefender: defender
      };
    }
  }
  
  return bestResult;
}
```

### 5.2 Evaluate a Specific Defender Choice

```typescript
/**
 * Calculate the expected outcome if we choose a specific defender.
 * Assumes opponent sends their optimal 2 attackers against this defender.
 * 
 * @param matrix - The matchup matrix
 * @param defender - Index of our player defending
 * @param ourRemaining - All our remaining players
 * @param oppRemaining - All opponent's remaining players
 */
function evaluateAsDefender(
  matrix: Matrix,
  defender: number,
  ourRemaining: PlayerPool,
  oppRemaining: PlayerPool
): EvaluationResult {
  
  // Find opponent's optimal attackers (2 lowest scores for us)
  const attackerPair = findOptimalAttackers(matrix, defender, oppRemaining);
  
  // We choose the better matchup
  const score1 = matrix[defender][attackerPair[0]];
  const score2 = matrix[defender][attackerPair[1]];
  
  const chosenAttacker = score1 >= score2 ? attackerPair[0] : attackerPair[1];
  const thisRoundScore = Math.max(score1, score2);
  
  // Calculate remaining player pools after this pairing
  const newOurRemaining = ourRemaining.filter(p => p !== defender);
  const newOppRemaining = oppRemaining.filter(p => p !== chosenAttacker);
  
  // Recursively evaluate the remaining game
  const futureResult = evaluateDefenderChoice(matrix, newOurRemaining, newOppRemaining);
  
  return {
    totalScore: thisRoundScore + futureResult.totalScore,
    pairings: [
      { ourPlayer: defender, oppPlayer: chosenAttacker, score: thisRoundScore },
      ...futureResult.pairings
    ]
  };
}
```

### 5.3 Find Opponent's Optimal Attackers

```typescript
/**
 * Find the 2 attackers opponent would send against our defender.
 * These are the 2 opponents that give us the lowest scores.
 * 
 * @param matrix - The matchup matrix  
 * @param defender - Our defender's index
 * @param oppRemaining - Available opponent players
 * @returns Tuple of 2 opponent indices
 */
function findOptimalAttackers(
  matrix: Matrix,
  defender: number,
  oppRemaining: PlayerPool
): [number, number] {
  
  // Get scores for defender vs each available opponent
  const scored = oppRemaining.map(opp => ({
    index: opp,
    score: matrix[defender][opp]
  }));
  
  // Sort by score ascending (worst for us first)
  scored.sort((a, b) => a.score - b.score);
  
  // Return the 2 that give us lowest scores
  return [scored[0].index, scored[1].index];
}
```

---

## 6. Attacker Selection Algorithm

After defenders are revealed, we need to choose which 2 of our remaining players to send against opponent's defender.

```typescript
/**
 * Analyse all possible attacker pairs we could send.
 * Returns them ranked by expected outcome.
 * 
 * @param matrix - The matchup matrix
 * @param oppDefender - Opponent's revealed defender index
 * @param ourAvailable - Our players available to attack
 * @param oppRemainingAfter - Opponent players remaining after their defender
 */
function analyseAttackerOptions(
  matrix: Matrix,
  oppDefender: number,
  ourAvailable: PlayerPool,
  oppRemainingAfter: PlayerPool
): AttackerOption[] {
  
  const options: AttackerOption[] = [];
  
  // Generate all pairs of available attackers
  for (let i = 0; i < ourAvailable.length; i++) {
    for (let j = i + 1; j < ourAvailable.length; j++) {
      const attacker1 = ourAvailable[i];
      const attacker2 = ourAvailable[j];
      
      // Opponent (as defender) will choose the better matchup for them
      // = the lower score for us
      const score1 = matrix[attacker1][oppDefender];
      const score2 = matrix[attacker2][oppDefender];
      
      // The attacker opponent will choose to face
      const chosenAttacker = score1 <= score2 ? attacker1 : attacker2;
      const refusedAttacker = score1 <= score2 ? attacker2 : attacker1;
      const thisRoundScore = Math.min(score1, score2);
      
      // Evaluate future game with refused attacker still in our pool
      const newOurRemaining = ourAvailable.filter(p => p !== chosenAttacker);
      const futureResult = evaluateDefenderChoice(
        matrix, 
        newOurRemaining, 
        oppRemainingAfter
      );
      
      options.push({
        attackers: [attacker1, attacker2],
        chosenByOpponent: chosenAttacker,
        refused: refusedAttacker,
        immediateScore: thisRoundScore,
        futureScore: futureResult.totalScore,
        totalScore: thisRoundScore + futureResult.totalScore,
        futurePairings: futureResult.pairings
      });
    }
  }
  
  // Sort by total score descending (best options first)
  options.sort((a, b) => b.totalScore - a.totalScore);
  
  return options;
}

interface AttackerOption {
  attackers: [number, number];     // The pair we'd send
  chosenByOpponent: number;        // Who opponent will pick to face
  refused: number;                 // Who returns to our pool
  immediateScore: number;          // Score from this pairing
  futureScore: number;             // Best score from remaining rounds
  totalScore: number;              // immediateScore + futureScore
  futurePairings: Pairing[];       // Optimal future pairings
}
```

---

## 7. Round 2 Considerations

Round 2 works identically to Round 1, except:

1. **Defender selection**: Only 3 players available (same algorithm, smaller pool)
2. **Attacker selection**: Only 2 players available = **no choice** (both must attack)

When only 2 attackers are available, the "pair selection" is forced, but we still calculate which one opponent will choose to face.

---

## 8. Complexity Analysis

| Component | Operations | Notes |
|-----------|------------|-------|
| Round 1 defender eval | 5 defenders × 2 attackers | 10 branches |
| Round 2 defender eval | 3 defenders × 2 attackers | 6 branches per R1 outcome |
| Round 3 | 1 forced | 1 lookup |
| **Total paths** | ~60 | Instantaneous on any device |

The algorithm runs in **O(n! × n)** where n=5, which equals ~600 operations worst case. This executes in under 1 millisecond.

---

## 9. Full API for the App

```typescript
// === TYPES ===

interface Player {
  id: number;
  name: string;
  faction: string;
}

interface DefenderRecommendation {
  player: Player;
  defenderScore: number;        // Simple metric (second-lowest)
  totalExpectedValue: number;   // Full tree evaluation
  worstMatchups: [Player, Player];
  isOptimal: boolean;
}

interface AttackerRecommendation {
  pair: [Player, Player];
  expectedScore: number;        // What we expect from this pairing
  totalExpectedValue: number;   // Including future rounds
  opponentWillChoose: Player;   // Who opponent picks to face
  isOptimal: boolean;
}

// === MAIN API FUNCTIONS ===

/**
 * Get defender recommendations for current game state.
 * Call this at the start of Round 1 and Round 2 defender selection.
 */
function getDefenderRecommendations(
  matrix: Matrix,
  ourPlayers: Player[],
  oppPlayers: Player[],
  ourRemaining: number[],
  oppRemaining: number[]
): DefenderRecommendation[] {
  
  const result = evaluateDefenderChoice(matrix, ourRemaining, oppRemaining);
  
  return ourRemaining.map(idx => {
    const evalAsDefender = evaluateAsDefender(matrix, idx, ourRemaining, oppRemaining);
    const attackers = findOptimalAttackers(matrix, idx, oppRemaining);
    
    return {
      player: ourPlayers[idx],
      defenderScore: calculateSimpleDefenderScore(matrix, idx, oppRemaining),
      totalExpectedValue: evalAsDefender.totalScore,
      worstMatchups: [oppPlayers[attackers[0]], oppPlayers[attackers[1]]],
      isOptimal: idx === result.bestDefender
    };
  }).sort((a, b) => b.totalExpectedValue - a.totalExpectedValue);
}

/**
 * Get attacker pair recommendations after opponent's defender is revealed.
 */
function getAttackerRecommendations(
  matrix: Matrix,
  ourPlayers: Player[],
  oppPlayers: Player[],
  oppDefender: number,
  ourAvailable: number[],
  oppRemainingAfterDefender: number[]
): AttackerRecommendation[] {
  
  const options = analyseAttackerOptions(
    matrix, 
    oppDefender, 
    ourAvailable, 
    oppRemainingAfterDefender
  );
  
  const bestTotal = options[0]?.totalScore ?? 0;
  
  return options.map(opt => ({
    pair: [ourPlayers[opt.attackers[0]], ourPlayers[opt.attackers[1]]],
    expectedScore: opt.immediateScore,
    totalExpectedValue: opt.totalScore,
    opponentWillChoose: ourPlayers[opt.chosenByOpponent],
    isOptimal: opt.totalScore === bestTotal
  }));
}

/**
 * Simple defender score (second-lowest row value).
 * Useful for display/intuition, but not for final recommendations.
 */
function calculateSimpleDefenderScore(
  matrix: Matrix,
  defender: number,
  oppRemaining: number[]
): number {
  const scores = oppRemaining.map(opp => matrix[defender][opp]);
  scores.sort((a, b) => a - b);
  return scores[1]; // Second lowest
}
```

---

## 10. Usage Flow in the App

### Round 1: Defender Selection Phase
```typescript
const recommendations = getDefenderRecommendations(
  matrix,
  ourPlayers,
  oppPlayers,
  [0, 1, 2, 3, 4],  // All 5 available
  [0, 1, 2, 3, 4]
);
// Display recommendations, user selects one
```

### Round 1: Attacker Selection Phase (after defenders revealed)
```typescript
const ourDefender = 2;  // User's choice
const oppDefender = 3;  // Revealed by opponent

const ourAvailable = [0, 1, 3, 4];           // Excluding our defender
const oppRemaining = [0, 1, 2, 4];           // Excluding their defender

const recommendations = getAttackerRecommendations(
  matrix,
  ourPlayers,
  oppPlayers,
  oppDefender,
  ourAvailable,
  oppRemaining
);
// Display pair options, user selects one
```

### After Round 1 Pairings Locked
```typescript
// Our defender faced one of their attackers
// Their defender faced one of our attackers
// Update remaining pools:
const ourRemainingR2 = [1, 3, 4];  // 3 players
const oppRemainingR2 = [0, 1, 4];  // 3 players

// Repeat process for Round 2...
```

---

## 11. Edge Cases

| Situation | Handling |
|-----------|----------|
| Tied defender scores | Show all tied options, pick first alphabetically |
| Tied attacker pairs | Show all tied options, user decides |
| Round 2 attacker selection | Only 1 pair possible, show confirmation not selection |
| Round 3 | No selection needed, show forced matchup |

---

## 12. Testing the Algorithm

### Test Matrix (from original document)
```typescript
const testMatrix = [
  [10, 8, 15, 12, 6],   // Player 0
  [14, 10, 9, 11, 13],  // Player 1
  [7, 12, 10, 8, 16],   // Player 2
  [11, 6, 13, 10, 9],   // Player 3
  [9, 15, 7, 14, 10],   // Player 4
];
```

### Expected Results

**Simple Defender Scores:**
| Player | Score | Calculation |
|--------|-------|-------------|
| 0 | 8 | sorted [6,8,10,12,15] → second = 8 |
| 1 | 10 | sorted [9,10,11,13,14] → second = 10 |
| 2 | 8 | sorted [7,8,10,12,16] → second = 8 |
| 3 | 9 | sorted [6,9,10,11,13] → second = 9 |
| 4 | 9 | sorted [7,9,10,14,15] → second = 9 |

**Full Evaluation**: Run `evaluateDefenderChoice(testMatrix, [0,1,2,3,4], [0,1,2,3,4])` and verify:
- Returns optimal defender with highest total game value
- Total score accounts for all 5 pairings
- May differ from simple defender score ranking

---

## 13. Summary

| Question | Algorithm |
|----------|-----------|
| "Who should defend?" | `evaluateDefenderChoice()` → backward induction |
| "Who should we send as attackers?" | `analyseAttackerOptions()` → evaluate each pair |
| "Which attacker should our defender face?" | Pick higher score (trivial) |
| "What's a player's defender score?" | Second-lowest row value (for display only) |

The key insight is that **every decision must consider downstream effects**. A locally suboptimal choice can be globally optimal when the full game tree is evaluated.

---

*Algorithm Document v1.0*

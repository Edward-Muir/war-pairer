/**
 * Game Tree Evaluation Algorithm (Advanced)
 *
 * Full minimax evaluation using backward induction to find truly optimal play.
 * This considers all future rounds when making the current decision.
 *
 * With n=5 players, the search space is tractable (~3,000 operations).
 *
 * Note: This is a simplified version that evaluates from one team's perspective.
 * A full implementation would need to model both teams' simultaneous defender choices.
 */

import { findWorstMatchups } from './defenderScore'

export interface GameResult {
  totalScore: number
  pairings: Array<{ our: number; opp: number; score: number }>
}

/**
 * Recursively evaluate the game tree using backward induction
 * Finds the optimal sequence of decisions considering all future rounds
 *
 * @param matrix - The matchup matrix
 * @param ourRemaining - Indices of our players still unpaired
 * @param oppRemaining - Indices of opponent players still unpaired
 * @param depth - Current recursion depth (for debugging)
 * @returns The best achievable result from this position
 */
export function evaluateGameTree(
  matrix: number[][],
  ourRemaining: number[],
  oppRemaining: number[],
  depth: number = 0
): GameResult {
  // Base case: Round 3 - only 1 player each, forced pairing
  if (ourRemaining.length === 1) {
    const score = matrix[ourRemaining[0]][oppRemaining[0]]
    return {
      totalScore: score,
      pairings: [{ our: ourRemaining[0], opp: oppRemaining[0], score }],
    }
  }

  let bestResult: GameResult = { totalScore: -Infinity, pairings: [] }

  // Try each possible defender choice for us
  for (const ourDefender of ourRemaining) {
    // Opponent sends optimal attackers (2 with lowest scores for us)
    const oppAttackers = findWorstMatchups(matrix, ourDefender, oppRemaining)

    // We choose the better matchup (higher score for us)
    const score1 = matrix[ourDefender][oppAttackers[0]]
    const score2 = matrix[ourDefender][oppAttackers[1]]
    const chosenOpp = score1 >= score2 ? oppAttackers[0] : oppAttackers[1]
    const thisRoundScore = Math.max(score1, score2)

    // Calculate remaining players after this defender phase
    // Note: This is simplified - full model needs to handle both teams' defenders
    const newOurRemaining = ourRemaining.filter((p) => p !== ourDefender)
    const newOppRemaining = oppRemaining.filter((p) => p !== chosenOpp)

    // Recurse for future rounds
    const futureResult = evaluateGameTree(matrix, newOurRemaining, newOppRemaining, depth + 1)

    const totalScore = thisRoundScore + futureResult.totalScore

    if (totalScore > bestResult.totalScore) {
      bestResult = {
        totalScore,
        pairings: [{ our: ourDefender, opp: chosenOpp, score: thisRoundScore }, ...futureResult.pairings],
      }
    }
  }

  return bestResult
}

/**
 * Get the optimal defender choice considering all future rounds
 * Returns the defender index that maximizes total expected score
 */
export function getOptimalDefender(
  matrix: number[][],
  ourRemaining: number[],
  oppRemaining: number[]
): { defenderIndex: number; expectedTotal: number } {
  const result = evaluateGameTree(matrix, ourRemaining, oppRemaining)

  if (result.pairings.length === 0) {
    return { defenderIndex: ourRemaining[0], expectedTotal: 0 }
  }

  return {
    defenderIndex: result.pairings[0].our,
    expectedTotal: result.totalScore,
  }
}

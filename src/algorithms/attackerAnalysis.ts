/**
 * Attacker Analysis Algorithm
 *
 * When opponent nominates a defender, we send 2 attackers.
 * The opponent then chooses which attacker faces their defender.
 * They will choose the matchup that's worse for us (lower score).
 *
 * For each possible attacker pair, our expected score is:
 * min(score1, score2) - because opponent picks the worse one for us
 *
 * We want to maximize this minimum, so we rank pairs by expected score descending.
 */

export interface AttackerPairAnalysis {
  attackers: [number, number] // Our player indices
  expectedScore: number // Score after opponent chooses (min of the two)
  forcedMatchup: number // Which attacker opponent will choose to face (the one with lower score)
  refusedAttacker: number // The attacker opponent refuses to face
}

/**
 * Analyze all possible attacker pairs we could send against opponent's defender
 * @param matrix - The matchup matrix where matrix[our][opp] = expected score
 * @param oppDefenderIndex - Index of opponent's defender
 * @param availablePlayers - Indices of our players available to attack
 * @returns Array of attacker pair analyses, sorted by expected score (highest first)
 */
export function analyzeAttackerPairs(
  matrix: number[][],
  oppDefenderIndex: number,
  availablePlayers: number[]
): AttackerPairAnalysis[] {
  const pairs: AttackerPairAnalysis[] = []

  // Generate all C(n,2) pairs of available players
  for (let i = 0; i < availablePlayers.length; i++) {
    for (let j = i + 1; j < availablePlayers.length; j++) {
      const p1 = availablePlayers[i]
      const p2 = availablePlayers[j]

      // Get each attacker's score against opponent's defender
      const score1 = matrix[p1][oppDefenderIndex]
      const score2 = matrix[p2][oppDefenderIndex]

      // Opponent will choose the better matchup for them (lower score for us)
      // Our expected score = min of the two (what we actually get)
      const expectedScore = Math.min(score1, score2)

      // Determine which attacker gets forced (opponent chooses to face them)
      const forcedMatchup = score1 <= score2 ? p1 : p2
      const refusedAttacker = score1 <= score2 ? p2 : p1

      pairs.push({
        attackers: [p1, p2],
        expectedScore,
        forcedMatchup,
        refusedAttacker,
      })
    }
  }

  // Sort by expected score descending (best outcomes first)
  return pairs.sort((a, b) => b.expectedScore - a.expectedScore)
}

/**
 * Get the single best attacker pair to send
 * Convenience function that returns just the top recommendation
 */
export function getBestAttackerPair(
  matrix: number[][],
  oppDefenderIndex: number,
  availablePlayers: number[]
): AttackerPairAnalysis | null {
  const pairs = analyzeAttackerPairs(matrix, oppDefenderIndex, availablePlayers)
  return pairs.length > 0 ? pairs[0] : null
}

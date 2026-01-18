/**
 * Defender Score Algorithm
 *
 * The defender score represents the best outcome we can guarantee when defending.
 * When we nominate a defender, the opponent sends their 2 best attackers against us.
 * We then get to choose which one to face.
 *
 * DefenderScore = second-lowest value in the defender's row (among available opponents)
 * This is because: opponent sends 2 lowest, we pick the better one (the second-lowest)
 */

export interface DefenderAnalysis {
  playerIndex: number
  defenderScore: number
  worstMatchups: [number, number] // Opponent indices who would be sent as attackers
}

/**
 * Calculate the Defender Score for a player
 * @param matrix - The matchup matrix where matrix[our][opp] = expected score
 * @param defenderIndex - Index of our player defending
 * @param availableOpponents - Indices of opponents still available
 * @returns The defender score (second-lowest value = best guaranteed outcome)
 */
export function calculateDefenderScore(
  matrix: number[][],
  defenderIndex: number,
  availableOpponents: number[]
): number {
  if (availableOpponents.length < 2) {
    // Edge case: only 1 opponent left, return that score
    return matrix[defenderIndex][availableOpponents[0]]
  }

  const scores = availableOpponents.map((oppIdx) => matrix[defenderIndex][oppIdx])
  const sorted = [...scores].sort((a, b) => a - b)
  return sorted[1] // Second lowest = best we can guarantee
}

/**
 * Find the two attackers opponent would optimally send against a defender
 * These are the two opponents with the lowest scores for us (best for opponent)
 * @param matrix - The matchup matrix
 * @param defenderIndex - Index of our player defending
 * @param availableOpponents - Indices of opponents still available
 * @returns Tuple of the two opponent indices who would be sent
 */
export function findWorstMatchups(
  matrix: number[][],
  defenderIndex: number,
  availableOpponents: number[]
): [number, number] {
  if (availableOpponents.length < 2) {
    // Edge case: return same index twice if only 1 available
    return [availableOpponents[0], availableOpponents[0]]
  }

  const scores = availableOpponents.map((oppIdx) => ({
    idx: oppIdx,
    score: matrix[defenderIndex][oppIdx],
  }))
  const sorted = scores.sort((a, b) => a.score - b.score)
  return [sorted[0].idx, sorted[1].idx] // Two lowest scores for us
}

/**
 * Analyze all available players as potential defenders and rank them
 * @param matrix - The matchup matrix
 * @param availablePlayers - Indices of our players still available
 * @param availableOpponents - Indices of opponents still available
 * @returns Array of defender analyses, sorted by defender score (highest first)
 */
export function analyzeDefenderOptions(
  matrix: number[][],
  availablePlayers: number[],
  availableOpponents: number[]
): DefenderAnalysis[] {
  return availablePlayers
    .map((playerIdx) => ({
      playerIndex: playerIdx,
      defenderScore: calculateDefenderScore(matrix, playerIdx, availableOpponents),
      worstMatchups: findWorstMatchups(matrix, playerIdx, availableOpponents),
    }))
    .sort((a, b) => b.defenderScore - a.defenderScore) // Highest first = best defender
}

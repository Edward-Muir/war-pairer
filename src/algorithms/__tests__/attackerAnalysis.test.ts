import { describe, it, expect } from 'vitest'
import { analyzeAttackerPairs, getBestAttackerPair } from '../attackerAnalysis'

/**
 * Test matrix from the UKTC Pairing App specification
 * matrix[ourPlayer][opponent] = expected score
 */
const testMatrix = [
  [10, 8, 15, 12, 6], // Player 0
  [14, 10, 9, 11, 13], // Player 1
  [7, 12, 10, 8, 16], // Player 2
  [11, 6, 13, 10, 9], // Player 3
  [9, 15, 7, 14, 10], // Player 4
]

describe('analyzeAttackerPairs', () => {
  it('generates correct number of pairs from 4 players', () => {
    // C(4,2) = 6 pairs
    const result = analyzeAttackerPairs(testMatrix, 0, [1, 2, 3, 4])
    expect(result).toHaveLength(6)
  })

  it('generates correct number of pairs from 3 players', () => {
    // C(3,2) = 3 pairs
    const result = analyzeAttackerPairs(testMatrix, 0, [1, 2, 3])
    expect(result).toHaveLength(3)
  })

  it('generates correct number of pairs from 2 players', () => {
    // C(2,2) = 1 pair
    const result = analyzeAttackerPairs(testMatrix, 0, [1, 2])
    expect(result).toHaveLength(1)
  })

  it('calculates correct expected score (min of pair)', () => {
    // Against opponent defender at index 0
    // Player 1 vs opp 0: score = 14
    // Player 2 vs opp 0: score = 7
    // Expected = min(14, 7) = 7 (opponent chooses Player 2 to face)
    const result = analyzeAttackerPairs(testMatrix, 0, [1, 2])
    expect(result[0].expectedScore).toBe(7)
    expect(result[0].forcedMatchup).toBe(2) // Player 2 is forced (lower score)
    expect(result[0].refusedAttacker).toBe(1) // Player 1 is refused
  })

  it('sorts pairs by expected score descending', () => {
    const result = analyzeAttackerPairs(testMatrix, 0, [1, 2, 3, 4])
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].expectedScore).toBeGreaterThanOrEqual(result[i + 1].expectedScore)
    }
  })

  it('correctly identifies best attacker pair against opponent 0', () => {
    // Attacking opponent at index 0
    // Our players [1,2,3,4] have scores against opp 0: [14, 7, 11, 9]
    // Best pair maximizes min(scoreA, scoreB)
    // Pair [1,3]: min(14, 11) = 11
    // Pair [1,4]: min(14, 9) = 9
    // Pair [1,2]: min(14, 7) = 7
    // Pair [3,4]: min(11, 9) = 9
    // Pair [2,3]: min(7, 11) = 7
    // Pair [2,4]: min(7, 9) = 7
    // Best is [1,3] with expected score 11
    const result = analyzeAttackerPairs(testMatrix, 0, [1, 2, 3, 4])
    expect(result[0].expectedScore).toBe(11)
    expect(result[0].attackers).toContain(1)
    expect(result[0].attackers).toContain(3)
  })

  it('correctly identifies forcedMatchup for best pair', () => {
    const result = analyzeAttackerPairs(testMatrix, 0, [1, 2, 3, 4])
    const bestPair = result[0]
    // Pair [1,3] with scores 14 and 11
    // Opponent forces player 3 (score 11 < 14)
    expect(bestPair.forcedMatchup).toBe(3)
    expect(bestPair.refusedAttacker).toBe(1)
  })

  it('handles attack against different opponent defenders', () => {
    // Attack opponent at index 2
    // Our players [0,1,3,4] have scores against opp 2: [15, 9, 13, 7]
    // Best pair to maximize min:
    // [0,3]: min(15, 13) = 13
    const result = analyzeAttackerPairs(testMatrix, 2, [0, 1, 3, 4])
    expect(result[0].expectedScore).toBe(13)
    expect(result[0].attackers).toContain(0)
    expect(result[0].attackers).toContain(3)
  })

  it('returns empty array when fewer than 2 players available', () => {
    const result = analyzeAttackerPairs(testMatrix, 0, [1])
    expect(result).toHaveLength(0)
  })
})

describe('getBestAttackerPair', () => {
  it('returns the best pair', () => {
    const result = getBestAttackerPair(testMatrix, 0, [1, 2, 3, 4])
    expect(result).not.toBeNull()
    expect(result!.expectedScore).toBe(11)
  })

  it('returns null when fewer than 2 players', () => {
    const result = getBestAttackerPair(testMatrix, 0, [1])
    expect(result).toBeNull()
  })

  it('returns same result as first element of analyzeAttackerPairs', () => {
    const allPairs = analyzeAttackerPairs(testMatrix, 0, [1, 2, 3, 4])
    const best = getBestAttackerPair(testMatrix, 0, [1, 2, 3, 4])
    expect(best).toEqual(allPairs[0])
  })
})

describe('attacker analysis edge cases', () => {
  it('handles tied scores correctly', () => {
    // Create a matrix with tied scores
    const tiedMatrix = [
      [10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10],
    ]
    const result = analyzeAttackerPairs(tiedMatrix, 0, [1, 2, 3, 4])
    // All pairs should have expectedScore of 10
    expect(result.every((p) => p.expectedScore === 10)).toBe(true)
  })

  it('handles extreme score differences', () => {
    const extremeMatrix = [
      [10, 10, 10, 10, 10],
      [20, 10, 10, 10, 10], // Player 1 dominates opp 0
      [0, 10, 10, 10, 10], // Player 2 is terrible vs opp 0
      [15, 10, 10, 10, 10],
      [5, 10, 10, 10, 10],
    ]
    // Attacking opp 0 with [1, 3]: scores 20, 15 → min = 15
    // Attacking opp 0 with [1, 4]: scores 20, 5 → min = 5
    // Best pair is [1, 3]
    const result = analyzeAttackerPairs(extremeMatrix, 0, [1, 2, 3, 4])
    expect(result[0].expectedScore).toBe(15)
    expect(result[0].attackers).toContain(1)
    expect(result[0].attackers).toContain(3)
  })
})

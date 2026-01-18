import { describe, it, expect } from 'vitest'
import {
  calculateDefenderScore,
  findWorstMatchups,
  analyzeDefenderOptions,
} from '../defenderScore'

/**
 * Test matrix from the UKTC Pairing App specification
 *
 * matrix[ourPlayer][opponent] = expected score (0-20 scale, 10 = even)
 *
 * Expected Defender Scores (second-lowest in each row):
 * Player 0: 8  (sorted: 6,8,10,12,15 → second = 8)
 * Player 1: 10 (sorted: 9,10,11,13,14 → second = 10) ← BEST
 * Player 2: 8  (sorted: 7,8,10,12,16 → second = 8)
 * Player 3: 9  (sorted: 6,9,10,11,13 → second = 9)
 * Player 4: 9  (sorted: 7,9,10,14,15 → second = 9)
 */
const testMatrix = [
  [10, 8, 15, 12, 6], // Player 0
  [14, 10, 9, 11, 13], // Player 1
  [7, 12, 10, 8, 16], // Player 2
  [11, 6, 13, 10, 9], // Player 3
  [9, 15, 7, 14, 10], // Player 4
]

const allPlayers = [0, 1, 2, 3, 4]
const allOpponents = [0, 1, 2, 3, 4]

describe('calculateDefenderScore', () => {
  it('returns correct defender score for Player 0', () => {
    // Row 0: [10, 8, 15, 12, 6] → sorted: [6, 8, 10, 12, 15] → second = 8
    expect(calculateDefenderScore(testMatrix, 0, allOpponents)).toBe(8)
  })

  it('returns correct defender score for Player 1 (best defender)', () => {
    // Row 1: [14, 10, 9, 11, 13] → sorted: [9, 10, 11, 13, 14] → second = 10
    expect(calculateDefenderScore(testMatrix, 1, allOpponents)).toBe(10)
  })

  it('returns correct defender score for Player 2', () => {
    // Row 2: [7, 12, 10, 8, 16] → sorted: [7, 8, 10, 12, 16] → second = 8
    expect(calculateDefenderScore(testMatrix, 2, allOpponents)).toBe(8)
  })

  it('returns correct defender score for Player 3', () => {
    // Row 3: [11, 6, 13, 10, 9] → sorted: [6, 9, 10, 11, 13] → second = 9
    expect(calculateDefenderScore(testMatrix, 3, allOpponents)).toBe(9)
  })

  it('returns correct defender score for Player 4', () => {
    // Row 4: [9, 15, 7, 14, 10] → sorted: [7, 9, 10, 14, 15] → second = 9
    expect(calculateDefenderScore(testMatrix, 4, allOpponents)).toBe(9)
  })

  it('handles subset of available opponents', () => {
    // Player 0 vs only opponents [0, 2, 3]
    // Scores: [10, 15, 12] → sorted: [10, 12, 15] → second = 12
    expect(calculateDefenderScore(testMatrix, 0, [0, 2, 3])).toBe(12)
  })

  it('handles edge case with only 1 opponent', () => {
    // Only opponent 2 available - should return that score
    expect(calculateDefenderScore(testMatrix, 0, [2])).toBe(15)
  })
})

describe('findWorstMatchups', () => {
  it('finds correct worst matchups for Player 0', () => {
    // Row 0: [10, 8, 15, 12, 6]
    // Lowest scores at indices 4 (6) and 1 (8)
    const result = findWorstMatchups(testMatrix, 0, allOpponents)
    expect(result).toContain(4) // score 6
    expect(result).toContain(1) // score 8
  })

  it('finds correct worst matchups for Player 1', () => {
    // Row 1: [14, 10, 9, 11, 13]
    // Lowest scores at indices 2 (9) and 1 (10)
    const result = findWorstMatchups(testMatrix, 1, allOpponents)
    expect(result).toContain(2) // score 9
    expect(result).toContain(1) // score 10
  })

  it('finds correct worst matchups for Player 2', () => {
    // Row 2: [7, 12, 10, 8, 16]
    // Lowest scores at indices 0 (7) and 3 (8)
    const result = findWorstMatchups(testMatrix, 2, allOpponents)
    expect(result).toContain(0) // score 7
    expect(result).toContain(3) // score 8
  })

  it('returns in correct order (lowest first)', () => {
    // Row 0: lowest at 4 (6), second at 1 (8)
    const result = findWorstMatchups(testMatrix, 0, allOpponents)
    expect(result[0]).toBe(4) // Lowest score first
    expect(result[1]).toBe(1) // Second lowest
  })

  it('handles subset of available opponents', () => {
    // Player 0 vs opponents [0, 2, 3, 4]
    // Scores: 10, 15, 12, 6 → lowest at 4 (6), second at 0 (10)
    const result = findWorstMatchups(testMatrix, 0, [0, 2, 3, 4])
    expect(result[0]).toBe(4) // score 6
    expect(result[1]).toBe(0) // score 10
  })
})

describe('analyzeDefenderOptions', () => {
  it('returns all players analyzed', () => {
    const result = analyzeDefenderOptions(testMatrix, allPlayers, allOpponents)
    expect(result).toHaveLength(5)
  })

  it('ranks Player 1 first (highest defender score)', () => {
    const result = analyzeDefenderOptions(testMatrix, allPlayers, allOpponents)
    expect(result[0].playerIndex).toBe(1)
    expect(result[0].defenderScore).toBe(10)
  })

  it('returns results sorted by defender score descending', () => {
    const result = analyzeDefenderOptions(testMatrix, allPlayers, allOpponents)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].defenderScore).toBeGreaterThanOrEqual(result[i + 1].defenderScore)
    }
  })

  it('includes correct worst matchups for each player', () => {
    const result = analyzeDefenderOptions(testMatrix, allPlayers, allOpponents)
    const player0Analysis = result.find((r) => r.playerIndex === 0)!
    expect(player0Analysis.worstMatchups).toContain(4) // score 6
    expect(player0Analysis.worstMatchups).toContain(1) // score 8
  })

  it('handles subset of available players', () => {
    const result = analyzeDefenderOptions(testMatrix, [0, 2, 4], allOpponents)
    expect(result).toHaveLength(3)
    // Should only contain players 0, 2, 4
    const indices = result.map((r) => r.playerIndex)
    expect(indices).toContain(0)
    expect(indices).toContain(2)
    expect(indices).toContain(4)
    expect(indices).not.toContain(1)
    expect(indices).not.toContain(3)
  })

  it('correctly ranks with subset (Round 2 scenario)', () => {
    // Simulating Round 2 with players [0, 2, 4] remaining
    const result = analyzeDefenderOptions(testMatrix, [0, 2, 4], allOpponents)
    // Player 4 has defender score 9, others have 8
    expect(result[0].playerIndex).toBe(4)
    expect(result[0].defenderScore).toBe(9)
  })
})

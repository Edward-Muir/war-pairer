import { describe, it, expect } from 'vitest'
import {
  analyzeDefenderPhase,
  analyzeAttackerPhase,
  buildDefenderPayoffMatrix,
  resolveAttackerExchange,
  solveZeroSumGame,
  getOpponentMatrix,
} from '../fullGameTheory'

// Test matrix from the algorithm document
const testMatrix = [
  [10, 8, 15, 12, 6], // Player 0
  [14, 10, 9, 11, 13], // Player 1
  [7, 12, 10, 8, 16], // Player 2
  [11, 6, 13, 10, 9], // Player 3
  [9, 15, 7, 14, 10], // Player 4
]

describe('fullGameTheory', () => {
  describe('analyzeDefenderPhase', () => {
    it('should return analysis for all available defenders', () => {
      const result = analyzeDefenderPhase(testMatrix, [0, 1, 2, 3, 4], [0, 1, 2, 3, 4])

      expect(result.defenderAnalyses).toHaveLength(5)
      expect(result.gameValue).toBeDefined()
      expect(result.payoffMatrix).toHaveLength(5)
      expect(result.payoffMatrix[0]).toHaveLength(5)
    })

    it('should include both defenderScore and gameValue for each player', () => {
      const result = analyzeDefenderPhase(testMatrix, [0, 1, 2, 3, 4], [0, 1, 2, 3, 4])

      result.defenderAnalyses.forEach((analysis) => {
        expect(analysis.defenderScore).toBeDefined()
        expect(analysis.gameValue).toBeDefined()
        expect(analysis.worstMatchups).toHaveLength(2)
        expect(typeof analysis.isOptimal).toBe('boolean')
      })
    })

    it('should sort defenders by gameValue descending', () => {
      const result = analyzeDefenderPhase(testMatrix, [0, 1, 2, 3, 4], [0, 1, 2, 3, 4])

      for (let i = 1; i < result.defenderAnalyses.length; i++) {
        expect(result.defenderAnalyses[i - 1].gameValue).toBeGreaterThanOrEqual(
          result.defenderAnalyses[i].gameValue
        )
      }
    })

    it('should mark at least one defender as optimal', () => {
      const result = analyzeDefenderPhase(testMatrix, [0, 1, 2, 3, 4], [0, 1, 2, 3, 4])

      const optimalCount = result.defenderAnalyses.filter((a) => a.isOptimal).length
      expect(optimalCount).toBeGreaterThanOrEqual(1)
    })

    it('should work with 3 players (round 2 scenario)', () => {
      const result = analyzeDefenderPhase(testMatrix, [1, 2, 4], [0, 2, 3])

      expect(result.defenderAnalyses).toHaveLength(3)
      expect(result.payoffMatrix).toHaveLength(3)
      expect(result.payoffMatrix[0]).toHaveLength(3)
    })

    it('should work with 1 player each (round 3 scenario)', () => {
      const result = analyzeDefenderPhase(testMatrix, [2], [3])

      expect(result.defenderAnalyses).toHaveLength(1)
      expect(result.gameValue).toBe(testMatrix[2][3]) // Direct matchup
    })
  })

  describe('analyzeAttackerPhase', () => {
    it('should return analysis for all possible attacker pairs', () => {
      // After round 1 defender selection: 4 attackers available, C(4,2) = 6 pairs
      const result = analyzeAttackerPhase(
        testMatrix,
        0, // ourDefender
        1, // oppDefender
        [1, 2, 3, 4], // our available attackers
        [0, 2, 3, 4] // opp available (excluding their defender)
      )

      expect(result).toHaveLength(6)
    })

    it('should include totalExpectedValue for each pair', () => {
      const result = analyzeAttackerPhase(testMatrix, 0, 1, [1, 2, 3, 4], [0, 2, 3, 4])

      result.forEach((analysis) => {
        expect(analysis.expectedScore).toBeDefined()
        expect(analysis.totalExpectedValue).toBeDefined()
        expect(analysis.forcedMatchup).toBeDefined()
        expect(analysis.refusedAttacker).toBeDefined()
        expect(typeof analysis.isOptimal).toBe('boolean')
      })
    })

    it('should sort by totalExpectedValue descending', () => {
      const result = analyzeAttackerPhase(testMatrix, 0, 1, [1, 2, 3, 4], [0, 2, 3, 4])

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].totalExpectedValue).toBeGreaterThanOrEqual(
          result[i].totalExpectedValue
        )
      }
    })

    it('should return 1 pair when only 2 attackers available (round 2)', () => {
      const result = analyzeAttackerPhase(
        testMatrix,
        1, // ourDefender
        2, // oppDefender
        [3, 4], // only 2 available
        [0, 1] // opp available
      )

      expect(result).toHaveLength(1)
      expect(result[0].attackers).toEqual([3, 4])
    })

    it('should correctly identify forcedMatchup (the one opponent will choose)', () => {
      const result = analyzeAttackerPhase(testMatrix, 0, 1, [2, 3], [0, 2])

      // Opponent will choose the attacker with lower score against them
      const pair = result[0]
      const score1 = testMatrix[pair.attackers[0]][1]
      const score2 = testMatrix[pair.attackers[1]][1]

      if (score1 <= score2) {
        expect(pair.forcedMatchup).toBe(pair.attackers[0])
      } else {
        expect(pair.forcedMatchup).toBe(pair.attackers[1])
      }
    })
  })

  describe('buildDefenderPayoffMatrix', () => {
    it('should build NxN matrix for N players', () => {
      const payoff = buildDefenderPayoffMatrix(testMatrix, [0, 1, 2, 3, 4], [0, 1, 2, 3, 4])

      expect(payoff).toHaveLength(5)
      payoff.forEach((row) => {
        expect(row).toHaveLength(5)
      })
    })

    it('should have symmetric-ish values around 50 (zero-sum property)', () => {
      const payoff = buildDefenderPayoffMatrix(testMatrix, [0, 1, 2, 3, 4], [0, 1, 2, 3, 4])

      // Total score across 5 games should be 100 for both teams combined
      // So our expected value should hover around 50 for balanced matchups
      const avgPayoff =
        payoff.flat().reduce((a, b) => a + b, 0) / (payoff.length * payoff[0].length)
      expect(avgPayoff).toBeGreaterThan(40)
      expect(avgPayoff).toBeLessThan(60)
    })

    it('should produce consistent results for same inputs', () => {
      const payoff1 = buildDefenderPayoffMatrix(testMatrix, [0, 1, 2], [1, 2, 3])
      const payoff2 = buildDefenderPayoffMatrix(testMatrix, [0, 1, 2], [1, 2, 3])

      expect(payoff1).toEqual(payoff2)
    })
  })

  describe('resolveAttackerExchange', () => {
    it('should return scores and pairings for a defender matchup', () => {
      const result = resolveAttackerExchange(
        testMatrix,
        0, // ourDefender
        1, // oppDefender
        [1, 2, 3, 4], // our attackers
        [0, 2, 3, 4] // opp attackers
      )

      expect(result.ourDefenderScore).toBeDefined()
      expect(result.ourAttackerScore).toBeDefined()
      expect(result.totalScore).toBe(result.ourDefenderScore + result.ourAttackerScore)
      expect(result.ourPairedPlayers).toHaveLength(2)
      expect(result.oppPairedPlayers).toHaveLength(2)
    })

    it('should pair our defender with an opponent attacker', () => {
      const result = resolveAttackerExchange(testMatrix, 0, 1, [1, 2, 3, 4], [0, 2, 3, 4])

      // Our defender should be in our paired players
      expect(result.ourPairedPlayers).toContain(0)
      // Opp paired players includes their defender (1) and one of our attackers who got chosen
      // The oppPairedPlayers[0] should be an opponent attacker (one of [0,2,3,4])
      // The oppPairedPlayers[1] is their defender which we attack
      expect(result.oppPairedPlayers).toHaveLength(2)
      // One should be from the opponent attackers (excluding their defender 1)
      expect([0, 2, 3, 4]).toContain(result.oppPairedPlayers[0])
      // The other is their defender
      expect(result.oppPairedPlayers).toContain(1)
    })

    it('should give us optimal defender choice (max of 2 attackers sent)', () => {
      const result = resolveAttackerExchange(testMatrix, 0, 1, [1, 2, 3, 4], [0, 2, 3, 4])

      // Opponent sends worst 2 attackers against our defender 0
      // Those would be players that give us lowest scores
      // We get to choose the better of those 2
      const possibleScores = [0, 2, 3, 4].map((opp) => testMatrix[0][opp])
      const sortedScores = [...possibleScores].sort((a, b) => a - b)
      // Second lowest is our defender score (we pick the better of 2 worst)
      expect(result.ourDefenderScore).toBe(sortedScores[1])
    })
  })

  describe('solveZeroSumGame', () => {
    it('should find saddle point when one exists', () => {
      // Create a matrix with a clear saddle point
      const matrixWithSaddle = [
        [3, 5, 7],
        [2, 4, 6],
        [1, 3, 5],
      ]

      const result = solveZeroSumGame(matrixWithSaddle, [0, 1, 2], [0, 1, 2])

      // The saddle point should be at (0, 0) with value 3
      // Row 0 min is 3, and column 0 max is also 3
      expect(result.isPure).toBe(true)
      expect(result.value).toBe(3)
    })

    it('should return maximin value when no saddle point exists', () => {
      // Rock-paper-scissors style matrix (no pure equilibrium)
      const rpsMatrix = [
        [0, -1, 1],
        [1, 0, -1],
        [-1, 1, 0],
      ]

      const result = solveZeroSumGame(rpsMatrix, [0, 1, 2], [0, 1, 2])

      // Maximin for this matrix should be -1 (each row's min is -1)
      expect(result.value).toBe(-1)
    })

    it('should handle 1x1 matrix', () => {
      const result = solveZeroSumGame([[10]], [0], [0])

      expect(result.value).toBe(10)
      expect(result.isPure).toBe(true)
    })

    it('should handle empty matrix', () => {
      const result = solveZeroSumGame([], [], [])

      expect(result.value).toBe(0)
    })
  })

  describe('getOpponentMatrix', () => {
    it('should transpose and invert scores', () => {
      const ourMatrix = [
        [10, 8],
        [6, 14],
      ]

      const oppMatrix = getOpponentMatrix(ourMatrix)

      // oppMatrix[j][i] = 20 - ourMatrix[i][j]
      expect(oppMatrix[0][0]).toBe(20 - 10) // = 10
      expect(oppMatrix[0][1]).toBe(20 - 6) // = 14
      expect(oppMatrix[1][0]).toBe(20 - 8) // = 12
      expect(oppMatrix[1][1]).toBe(20 - 14) // = 6
    })

    it('should be inverse of our matrix (zero-sum property)', () => {
      const oppMatrix = getOpponentMatrix(testMatrix)

      // For any matchup, our score + their score = 20
      for (let i = 0; i < testMatrix.length; i++) {
        for (let j = 0; j < testMatrix[i].length; j++) {
          expect(testMatrix[i][j] + oppMatrix[j][i]).toBe(20)
        }
      }
    })
  })

  describe('integration: full game analysis', () => {
    it('should provide consistent recommendations across phases', () => {
      // Round 1: Get defender recommendation
      const defenderResult = analyzeDefenderPhase(
        testMatrix,
        [0, 1, 2, 3, 4],
        [0, 1, 2, 3, 4]
      )

      // Pick the optimal defender
      const optimalDefender = defenderResult.defenderAnalyses.find((a) => a.isOptimal)
      expect(optimalDefender).toBeDefined()

      // Simulate: both teams picked defenders
      const ourDefender = optimalDefender!.playerIndex
      const oppDefender = 2 // Arbitrary opponent choice

      // Get attacker recommendations
      const ourAttackers = [0, 1, 2, 3, 4].filter((p) => p !== ourDefender)
      const oppAttackers = [0, 1, 2, 3, 4].filter((p) => p !== oppDefender)

      const attackerResult = analyzeAttackerPhase(
        testMatrix,
        ourDefender,
        oppDefender,
        ourAttackers,
        oppAttackers
      )

      expect(attackerResult.length).toBeGreaterThan(0)
      expect(attackerResult[0].isOptimal).toBe(true)
    })

    it('should compute reasonable game values for balanced matrix', () => {
      // Create a perfectly balanced matrix (all 10s)
      const balancedMatrix = Array(5)
        .fill(null)
        .map(() => Array(5).fill(10))

      const result = analyzeDefenderPhase(
        balancedMatrix,
        [0, 1, 2, 3, 4],
        [0, 1, 2, 3, 4]
      )

      // With all matchups at 10, total expected should be 50 (5 games × 10)
      expect(result.gameValue).toBe(50)
    })

    it('should give higher game values for favorable matchups', () => {
      // Create a matrix where player 0 is very strong
      const strongP0Matrix = [
        [15, 15, 15, 15, 15], // Player 0 scores 15 vs everyone
        [10, 10, 10, 10, 10], // Others score 10
        [10, 10, 10, 10, 10],
        [10, 10, 10, 10, 10],
        [10, 10, 10, 10, 10],
      ]

      const result = analyzeDefenderPhase(
        strongP0Matrix,
        [0, 1, 2, 3, 4],
        [0, 1, 2, 3, 4]
      )

      // Game value should be above 50 since we have a strong player
      expect(result.gameValue).toBeGreaterThan(50)
    })
  })

  describe('edge cases', () => {
    it('should handle round 2 with 3 players', () => {
      const result = analyzeDefenderPhase(testMatrix, [0, 2, 4], [1, 2, 3])

      expect(result.defenderAnalyses).toHaveLength(3)
      expect(result.equilibrium).toBeDefined()
    })

    it('should handle forced final pairing (1 player each)', () => {
      const result = analyzeDefenderPhase(testMatrix, [3], [4])

      expect(result.defenderAnalyses).toHaveLength(1)
      expect(result.gameValue).toBe(testMatrix[3][4])
    })

    it('should handle attacker phase with only 2 attackers', () => {
      const result = analyzeAttackerPhase(testMatrix, 0, 1, [2, 3], [2, 4])

      expect(result).toHaveLength(1)
      expect(result[0].attackers).toContain(2)
      expect(result[0].attackers).toContain(3)
    })
  })

  describe('obvious dominance cases', () => {
    it('should recommend dominant defender over weak defenders', () => {
      // Player 0 scores 17+ against everyone - clearly dominant
      // Players 1-4 all score 10 against everyone
      const dominantDefenderMatrix = [
        [17, 18, 17, 18, 17], // Player 0 - dominant
        [10, 10, 10, 10, 10], // Player 1
        [10, 10, 10, 10, 10], // Player 2
        [10, 10, 10, 10, 10], // Player 3
        [10, 10, 10, 10, 10], // Player 4
      ]

      const result = analyzeDefenderPhase(
        dominantDefenderMatrix,
        [0, 1, 2, 3, 4],
        [0, 1, 2, 3, 4]
      )

      // Player 0 should be the optimal defender (first in sorted list)
      expect(result.defenderAnalyses[0].playerIndex).toBe(0)
      expect(result.defenderAnalyses[0].isOptimal).toBe(true)
    })

    it('should avoid dominated defender who scores poorly', () => {
      // Player 4 scores 0 against everyone - extremely dominated as defender
      // Player 4 also scores 0 as attacker - completely useless player
      // All others are equal and decent
      const dominatedDefenderMatrix = [
        [10, 10, 10, 10, 10], // Player 0
        [10, 10, 10, 10, 10], // Player 1
        [10, 10, 10, 10, 10], // Player 2
        [10, 10, 10, 10, 10], // Player 3
        [0, 0, 0, 0, 0], // Player 4 - scores 0 vs everyone (useless)
      ]

      const result = analyzeDefenderPhase(
        dominatedDefenderMatrix,
        [0, 1, 2, 3, 4],
        [0, 1, 2, 3, 4]
      )

      // Find player 4's analysis
      const player4Analysis = result.defenderAnalyses.find((a) => a.playerIndex === 4)!

      // Player 4 should NOT be optimal (scores 0 as defender)
      expect(player4Analysis.isOptimal).toBe(false)

      // Player 4's defenderScore should be 0 (scores 0 against everyone)
      expect(player4Analysis.defenderScore).toBe(0)
    })

    it('should find clear saddle point in simple matrix', () => {
      // Matrix designed so that defender 0 vs opponent 0 is a saddle point
      // Row 0 has min at column 0 (value 8), column 0 has max at row 0 (value 8)
      const saddlePointMatrix = [
        [8, 10, 12, 11, 9], // Row min = 8 at col 0
        [6, 9, 11, 10, 8], // Row min = 6
        [5, 8, 10, 9, 7], // Row min = 5
        [7, 10, 12, 11, 9], // Row min = 7
        [4, 7, 9, 8, 6], // Row min = 4
        // Col max: 8, 10, 12, 11, 9
      ]

      const result = solveZeroSumGame(saddlePointMatrix, [0, 1, 2, 3, 4], [0, 1, 2, 3, 4])

      // Saddle point at (0, 0) with value 8
      expect(result.isPure).toBe(true)
      expect(result.value).toBe(8)
    })

    it('should prefer attacker pair with higher minimum score', () => {
      // Create a matrix where one pair clearly dominates
      // Against opponent defender (player 1):
      // - Pair [2,3] scores [15, 14] -> min = 14
      // - Pair [2,4] scores [15, 8] -> min = 8
      // - Pair [3,4] scores [14, 8] -> min = 8
      const attackerMatrix = [
        [10, 10, 10, 10, 10], // Player 0 (our defender)
        [10, 10, 10, 10, 10], // Player 1 (their defender)
        [10, 15, 10, 10, 10], // Player 2 - scores 15 vs opp defender
        [10, 14, 10, 10, 10], // Player 3 - scores 14 vs opp defender
        [10, 8, 10, 10, 10], // Player 4 - scores 8 vs opp defender
      ]

      const result = analyzeAttackerPhase(
        attackerMatrix,
        0, // our defender
        1, // their defender
        [2, 3, 4], // our attackers
        [2, 3, 4] // their attackers
      )

      // Pair [2, 3] should be optimal (min score 14 > others)
      expect(result[0].attackers).toContain(2)
      expect(result[0].attackers).toContain(3)
      expect(result[0].isOptimal).toBe(true)
      // Expected score is the min of the pair (opponent chooses worse for us)
      expect(result[0].expectedScore).toBe(14)
    })

    it('should avoid sending weak attacker when strong pairs exist', () => {
      // Player 4 is terrible against opponent's defender (player 1)
      const weakAttackerMatrix = [
        [10, 10, 10, 10, 10],
        [10, 10, 10, 10, 10],
        [10, 16, 10, 10, 10], // Player 2 - great vs defender
        [10, 15, 10, 10, 10], // Player 3 - good vs defender
        [10, 2, 10, 10, 10], // Player 4 - terrible vs defender
      ]

      const result = analyzeAttackerPhase(weakAttackerMatrix, 0, 1, [2, 3, 4], [2, 3, 4])

      // Optimal pair should NOT include player 4
      expect(result[0].attackers).not.toContain(4)
    })
  })

  describe('Monte Carlo simulation: algorithm vs random opponent', () => {
    // Generate a balanced random matrix where total expected value = 50 for both
    function generateBalancedMatrix(): number[][] {
      const matrix: number[][] = Array(5)
        .fill(null)
        .map(() => Array(5).fill(10))

      // For each pair (i, j) where i < j, set random score and its complement
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

    // Pick a random element from array
    function randomChoice<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)]
    }

    // Pick a random pair from array
    function randomPair(arr: number[]): [number, number] {
      const shuffled = [...arr].sort(() => Math.random() - 0.5)
      return [shuffled[0], shuffled[1]]
    }

    // Simulate a full game with algorithm (us) vs random (opponent)
    function simulateGame(matrix: number[][]): { ourScore: number; oppScore: number } {
      let ourRemaining = [0, 1, 2, 3, 4]
      let oppRemaining = [0, 1, 2, 3, 4]
      let ourScore = 0
      let oppScore = 0

      // Round 1: 5v5 -> 2 pairings
      {
        // We pick optimal defender
        const defResult = analyzeDefenderPhase(matrix, ourRemaining, oppRemaining)
        const ourDefender = defResult.defenderAnalyses[0].playerIndex

        // Opponent picks random defender
        const oppDefender = randomChoice(oppRemaining)

        // Get attackers
        const ourAttackers = ourRemaining.filter((p) => p !== ourDefender)
        const oppAttackers = oppRemaining.filter((p) => p !== oppDefender)

        // We pick optimal attacker pair
        const atkResult = analyzeAttackerPhase(
          matrix,
          ourDefender,
          oppDefender,
          ourAttackers,
          oppAttackers
        )
        const ourPair = atkResult[0].attackers

        // Opponent picks random attacker pair
        const oppPair = randomPair(oppAttackers)

        // Resolve: defenders choose from sent attackers
        // Our defender chooses best of oppPair
        const ourDefScore = Math.max(matrix[ourDefender][oppPair[0]], matrix[ourDefender][oppPair[1]])
        const oppAttackerChosen = matrix[ourDefender][oppPair[0]] >= matrix[ourDefender][oppPair[1]]
          ? oppPair[0] : oppPair[1]

        // Their defender chooses worst for us from ourPair
        const ourAtkScore = Math.min(matrix[ourPair[0]][oppDefender], matrix[ourPair[1]][oppDefender])
        const ourAttackerChosen = matrix[ourPair[0]][oppDefender] <= matrix[ourPair[1]][oppDefender]
          ? ourPair[0] : ourPair[1]

        ourScore += ourDefScore + ourAtkScore
        oppScore += (20 - ourDefScore) + (20 - ourAtkScore)

        // Remove paired players
        ourRemaining = ourRemaining.filter(
          (p) => p !== ourDefender && p !== ourAttackerChosen
        )
        oppRemaining = oppRemaining.filter(
          (p) => p !== oppDefender && p !== oppAttackerChosen
        )
      }

      // Round 2: 3v3 -> 2 pairings
      {
        const defResult = analyzeDefenderPhase(matrix, ourRemaining, oppRemaining)
        const ourDefender = defResult.defenderAnalyses[0].playerIndex
        const oppDefender = randomChoice(oppRemaining)

        const ourAttackers = ourRemaining.filter((p) => p !== ourDefender)
        const oppAttackers = oppRemaining.filter((p) => p !== oppDefender)

        const atkResult = analyzeAttackerPhase(
          matrix,
          ourDefender,
          oppDefender,
          ourAttackers,
          oppAttackers
        )
        const ourPair = atkResult[0].attackers
        const oppPair = randomPair(oppAttackers)

        const ourDefScore = Math.max(matrix[ourDefender][oppPair[0]], matrix[ourDefender][oppPair[1]])
        const oppAttackerChosen = matrix[ourDefender][oppPair[0]] >= matrix[ourDefender][oppPair[1]]
          ? oppPair[0] : oppPair[1]

        const ourAtkScore = Math.min(matrix[ourPair[0]][oppDefender], matrix[ourPair[1]][oppDefender])
        const ourAttackerChosen = matrix[ourPair[0]][oppDefender] <= matrix[ourPair[1]][oppDefender]
          ? ourPair[0] : ourPair[1]

        ourScore += ourDefScore + ourAtkScore
        oppScore += (20 - ourDefScore) + (20 - ourAtkScore)

        ourRemaining = ourRemaining.filter(
          (p) => p !== ourDefender && p !== ourAttackerChosen
        )
        oppRemaining = oppRemaining.filter(
          (p) => p !== oppDefender && p !== oppAttackerChosen
        )
      }

      // Round 3: 1v1 forced matchup
      {
        const finalOur = ourRemaining[0]
        const finalOpp = oppRemaining[0]
        const finalScore = matrix[finalOur][finalOpp]
        ourScore += finalScore
        oppScore += 20 - finalScore
      }

      return { ourScore, oppScore }
    }

    it('should win more than 55% of games against random opponent on balanced matrices', () => {
      const NUM_GAMES = 100
      let wins = 0
      let ties = 0

      for (let i = 0; i < NUM_GAMES; i++) {
        const matrix = generateBalancedMatrix()
        const { ourScore, oppScore } = simulateGame(matrix)

        if (ourScore > oppScore) {
          wins++
        } else if (ourScore === oppScore) {
          ties++
        }
      }

      const winRate = wins / NUM_GAMES

      // Log for visibility
      console.log(`Algorithm vs Random: ${wins} wins, ${ties} ties out of ${NUM_GAMES} games`)
      console.log(`Win rate: ${(winRate * 100).toFixed(1)}%`)

      // We should win more than 55% of games
      expect(winRate).toBeGreaterThan(0.55)
    })

    it('should have positive expected score advantage on balanced matrices', () => {
      const NUM_GAMES = 100
      let totalOurScore = 0
      let totalOppScore = 0

      for (let i = 0; i < NUM_GAMES; i++) {
        const matrix = generateBalancedMatrix()
        const { ourScore, oppScore } = simulateGame(matrix)
        totalOurScore += ourScore
        totalOppScore += oppScore
      }

      const avgOurScore = totalOurScore / NUM_GAMES
      const avgOppScore = totalOppScore / NUM_GAMES

      console.log(`Average scores - Us: ${avgOurScore.toFixed(1)}, Opponent: ${avgOppScore.toFixed(1)}`)

      // Our average score should exceed opponent's (>50 vs <50)
      expect(avgOurScore).toBeGreaterThan(avgOppScore)
    })
  })
})

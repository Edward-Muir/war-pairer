/**
 * Full Game-Theoretic Pairing Algorithm
 *
 * Implements backward induction with Nash equilibrium for the UKTC pairing process.
 * This considers both teams' simultaneous defender choices as a two-player zero-sum game.
 *
 * Key insight: On a 0-20 scale, if we score X, opponent scores (20-X).
 * This makes it a zero-sum game where minimax = Nash equilibrium.
 */

import { calculateDefenderScore, findWorstMatchups } from './defenderScore'

// ============================================================================
// Types
// ============================================================================

/** Result of analyzing the defender selection phase */
export interface DefenderPhaseResult {
  /** Expected total score with optimal play from both sides */
  gameValue: number
  /** Payoff matrix: payoffMatrix[ourDefender][oppDefender] = total expected score */
  payoffMatrix: number[][]
  /** Analysis for each of our defender options */
  defenderAnalyses: FullDefenderAnalysis[]
  /** Nash equilibrium solution */
  equilibrium: GameEquilibrium
}

/** Extended defender analysis with full game tree evaluation */
export interface FullDefenderAnalysis {
  playerIndex: number
  /** Simple defender score (second-lowest) for intuition */
  defenderScore: number
  /** The two attackers opponent would likely send */
  worstMatchups: [number, number]
  /** Total expected value from full backward induction (minimax value) */
  gameValue: number
  /** Whether this defender is part of the optimal strategy */
  isOptimal: boolean
  /** Worst-case score if opponent plays optimally against this choice */
  worstCaseValue: number
  /** Best-case score if opponent makes a mistake */
  bestCaseValue: number
}

/** Extended attacker pair analysis with future round evaluation */
export interface FullAttackerAnalysis {
  attackers: [number, number]
  /** Score from this immediate pairing */
  expectedScore: number
  /** Which attacker opponent will choose to face */
  forcedMatchup: number
  /** Which attacker returns to our pool */
  refusedAttacker: number
  /** Total expected value including all future rounds */
  totalExpectedValue: number
  /** Whether this is the optimal choice */
  isOptimal: boolean
}

/** Analysis of opponent's attacker pair options from their perspective */
export interface OpponentAttackerAnalysis {
  /** Opponent player indices */
  attackers: [number, number]
  /** What we score from this immediate pairing (min of the two) */
  expectedScoreForUs: number
  /** What opponent scores from this immediate pairing (20 - ourScore) */
  expectedScoreForOpp: number
  /** Opponent's total expected value including future rounds */
  totalExpectedValueForOpp: number
  /** Which attacker they'd force to face our defender (lower score for us) */
  forcedMatchup: number
  /** Whether this is their optimal choice */
  isOptimal: boolean
}

/** Nash equilibrium solution for a zero-sum game */
export interface GameEquilibrium {
  /** Value of the game (expected score with optimal play) */
  value: number
  /** Our optimal strategy */
  ourStrategy: Strategy
  /** Opponent's optimal strategy */
  oppStrategy: Strategy
  /** Whether a pure strategy equilibrium exists */
  isPure: boolean
}

/** A strategy can be pure (single choice) or mixed (probability distribution) */
export interface Strategy {
  type: 'pure' | 'mixed'
  /** For pure strategy: the single optimal choice */
  pureChoice?: number
  /** For mixed strategy: map of choice -> probability */
  mixedProbabilities?: Map<number, number>
}

/** Result of a single pairing round (2 pairings locked) */
interface PairingRoundResult {
  /** Score we get from our defender's matchup */
  ourDefenderScore: number
  /** Score we get from attacking their defender */
  ourAttackerScore: number
  /** Total score this round */
  totalScore: number
  /** Which of our players got paired */
  ourPairedPlayers: [number, number]
  /** Which opponent players got paired */
  oppPairedPlayers: [number, number]
}

// ============================================================================
// Main Entry Points
// ============================================================================

/**
 * Analyze the defender selection phase with full game tree evaluation.
 * This is the main entry point for defender selection screens.
 *
 * @param matrix - The matchup matrix where matrix[our][opp] = expected score for us
 * @param ourRemaining - Indices of our available players
 * @param oppRemaining - Indices of opponent's available players
 * @returns Full analysis including game value, payoff matrix, and recommendations
 */
export function analyzeDefenderPhase(
  matrix: number[][],
  ourRemaining: number[],
  oppRemaining: number[]
): DefenderPhaseResult {
  // Special case: only 1 player each (round 3 forced pairing)
  if (ourRemaining.length === 1) {
    const ourPlayer = ourRemaining[0]
    const oppPlayer = oppRemaining[0]
    const score = matrix[ourPlayer][oppPlayer]

    return {
      gameValue: score,
      payoffMatrix: [[score]],
      defenderAnalyses: [
        {
          playerIndex: ourPlayer,
          defenderScore: score,
          worstMatchups: [oppPlayer, oppPlayer] as [number, number],
          gameValue: score,
          isOptimal: true,
          worstCaseValue: score,
          bestCaseValue: score,
        },
      ],
      equilibrium: {
        value: score,
        ourStrategy: { type: 'pure', pureChoice: ourPlayer },
        oppStrategy: { type: 'pure', pureChoice: oppPlayer },
        isPure: true,
      },
    }
  }

  // Build the payoff matrix for all defender combinations
  const payoffMatrix = buildDefenderPayoffMatrix(matrix, ourRemaining, oppRemaining)

  // Solve for Nash equilibrium
  const equilibrium = solveZeroSumGame(payoffMatrix, ourRemaining, oppRemaining)

  // Build detailed analysis for each defender option
  const defenderAnalyses = ourRemaining.map((playerIdx, i) => {
    const row = payoffMatrix[i]
    const worstCase = Math.min(...row)
    const bestCase = Math.max(...row)

    // Check if this defender is part of the optimal strategy
    let isOptimal = false
    if (equilibrium.ourStrategy.type === 'pure') {
      isOptimal = equilibrium.ourStrategy.pureChoice === playerIdx
    } else if (equilibrium.ourStrategy.mixedProbabilities) {
      const prob = equilibrium.ourStrategy.mixedProbabilities.get(playerIdx) ?? 0
      isOptimal = prob > 0
    }

    return {
      playerIndex: playerIdx,
      defenderScore: calculateDefenderScore(matrix, playerIdx, oppRemaining),
      worstMatchups: findWorstMatchups(matrix, playerIdx, oppRemaining),
      gameValue: worstCase, // Minimax value for this defender
      isOptimal,
      worstCaseValue: worstCase,
      bestCaseValue: bestCase,
    }
  })

  // Sort by game value (minimax) descending
  defenderAnalyses.sort((a, b) => b.gameValue - a.gameValue)

  return {
    gameValue: equilibrium.value,
    payoffMatrix,
    defenderAnalyses,
    equilibrium,
  }
}

/**
 * Analyze attacker pair options after both defenders are revealed.
 * This includes evaluation of future rounds via backward induction.
 *
 * @param matrix - The matchup matrix
 * @param ourDefender - Index of our defender (already chosen)
 * @param oppDefender - Index of opponent's defender (revealed)
 * @param ourAvailable - Our players available to attack (excluding our defender)
 * @param oppAvailable - Opponent players available (excluding their defender)
 * @returns Ranked list of attacker pair options with total expected values
 */
export function analyzeAttackerPhase(
  matrix: number[][],
  ourDefender: number,
  oppDefender: number,
  ourAvailable: number[],
  oppAvailable: number[]
): FullAttackerAnalysis[] {
  const analyses: FullAttackerAnalysis[] = []

  // Generate all possible attacker pairs
  for (let i = 0; i < ourAvailable.length; i++) {
    for (let j = i + 1; j < ourAvailable.length; j++) {
      const attacker1 = ourAvailable[i]
      const attacker2 = ourAvailable[j]

      // Opponent chooses which attacker faces their defender (picks worse for us)
      const score1 = matrix[attacker1][oppDefender]
      const score2 = matrix[attacker2][oppDefender]
      const expectedScore = Math.min(score1, score2)
      const forcedMatchup = score1 <= score2 ? attacker1 : attacker2
      const refusedAttacker = score1 <= score2 ? attacker2 : attacker1

      // Calculate who attacks our defender (opponent sends optimal attackers)
      const oppAttackers = findWorstMatchups(matrix, ourDefender, oppAvailable)
      const ourDefenderScore1 = matrix[ourDefender][oppAttackers[0]]
      const ourDefenderScore2 = matrix[ourDefender][oppAttackers[1]]
      const ourDefenderScore = Math.max(ourDefenderScore1, ourDefenderScore2)
      const oppAttackerChosen =
        ourDefenderScore1 >= ourDefenderScore2 ? oppAttackers[0] : oppAttackers[1]

      // Calculate remaining players after this round
      const newOurRemaining = ourAvailable.filter((p) => p !== forcedMatchup)
      const newOppRemaining = oppAvailable.filter((p) => p !== oppAttackerChosen)

      // Evaluate future rounds
      let futureValue: number
      if (newOurRemaining.length === 1) {
        // Round 3: forced pairing
        futureValue = matrix[newOurRemaining[0]][newOppRemaining[0]]
      } else {
        // Round 2: recursive evaluation
        const futureResult = analyzeDefenderPhase(matrix, newOurRemaining, newOppRemaining)
        futureValue = futureResult.gameValue
      }

      const totalExpectedValue = expectedScore + ourDefenderScore + futureValue

      analyses.push({
        attackers: [attacker1, attacker2],
        expectedScore,
        forcedMatchup,
        refusedAttacker,
        totalExpectedValue,
        isOptimal: false, // Will be set after sorting
      })
    }
  }

  // Sort by total expected value descending
  analyses.sort((a, b) => b.totalExpectedValue - a.totalExpectedValue)

  // Mark optimal choices (may be ties)
  if (analyses.length > 0) {
    const bestValue = analyses[0].totalExpectedValue
    analyses.forEach((a) => {
      a.isOptimal = a.totalExpectedValue === bestValue
    })
  }

  return analyses
}

/**
 * Analyze opponent's attacker pair options from their perspective.
 * Uses full backward induction to evaluate future rounds.
 *
 * @param matrix - The matchup matrix (from our perspective: matrix[our][opp] = our score)
 * @param ourDefender - Index of our defender
 * @param oppDefender - Index of opponent's defender
 * @param ourAvailable - Our players available to attack (excluding our defender)
 * @param oppAvailable - Opponent players available (excluding their defender)
 * @returns Ranked list of opponent's attacker pair options (best for them first)
 */
export function analyzeOpponentAttackerPhase(
  matrix: number[][],
  ourDefender: number,
  oppDefender: number,
  ourAvailable: number[],
  oppAvailable: number[]
): OpponentAttackerAnalysis[] {
  const analyses: OpponentAttackerAnalysis[] = []

  // Generate all possible opponent attacker pairs
  for (let i = 0; i < oppAvailable.length; i++) {
    for (let j = i + 1; j < oppAvailable.length; j++) {
      const oppAttacker1 = oppAvailable[i]
      const oppAttacker2 = oppAvailable[j]

      // Our defender chooses which opponent attacker to face (picks higher score for us)
      const score1 = matrix[ourDefender][oppAttacker1]
      const score2 = matrix[ourDefender][oppAttacker2]
      const expectedScoreForUs = Math.min(score1, score2) // They pick worse for us
      const expectedScoreForOpp = 20 - expectedScoreForUs
      const forcedMatchup = score1 <= score2 ? oppAttacker1 : oppAttacker2
      const oppAttackerChosen = score1 <= score2 ? oppAttacker1 : oppAttacker2

      // Calculate who we send against their defender (our optimal attackers)
      const ourSentAttackers = findOptimalAttackerPairForUsInternal(
        matrix,
        oppDefender,
        ourAvailable
      )
      const ourAtt1Score = matrix[ourSentAttackers[0]][oppDefender]
      const ourAtt2Score = matrix[ourSentAttackers[1]][oppDefender]
      const ourAttackerScore = Math.min(ourAtt1Score, ourAtt2Score)
      const ourAttackerChosen =
        ourAtt1Score <= ourAtt2Score ? ourSentAttackers[0] : ourSentAttackers[1]

      // Calculate remaining players after this round
      const newOurRemaining = ourAvailable.filter((p) => p !== ourAttackerChosen)
      const newOppRemaining = oppAvailable.filter((p) => p !== oppAttackerChosen)

      // Calculate our defender's score in this exchange
      const ourDefenderScore = Math.max(score1, score2)

      // Evaluate future rounds
      let futureValueForUs: number
      if (newOurRemaining.length === 1) {
        // Round 3: forced pairing
        futureValueForUs = matrix[newOurRemaining[0]][newOppRemaining[0]]
      } else if (newOurRemaining.length === 0) {
        futureValueForUs = 0
      } else {
        // Round 2: recursive evaluation
        const futureResult = analyzeDefenderPhase(
          matrix,
          newOurRemaining,
          newOppRemaining
        )
        futureValueForUs = futureResult.gameValue
      }

      // Total value for us from this round onwards
      const totalExpectedValueForUs =
        ourDefenderScore + ourAttackerScore + futureValueForUs

      // Number of remaining pairings (including this round)
      // Round 1: 3 pairings (5v5 -> 3v3 -> 1v1)
      // Round 2: 2 pairings (3v3 -> 1v1)
      const numRemainingPairings =
        newOurRemaining.length === 1 ? 2 : newOurRemaining.length === 0 ? 1 : 3

      // Convert to opponent's perspective (zero-sum: total points = 20 * numPairings)
      const totalExpectedValueForOpp =
        20 * numRemainingPairings - totalExpectedValueForUs

      analyses.push({
        attackers: [oppAttacker1, oppAttacker2],
        expectedScoreForUs,
        expectedScoreForOpp,
        totalExpectedValueForOpp,
        forcedMatchup,
        isOptimal: false,
      })
    }
  }

  // Sort by opponent's total expected value descending (best for them first)
  analyses.sort((a, b) => b.totalExpectedValueForOpp - a.totalExpectedValueForOpp)

  // Mark optimal choices (may be ties)
  if (analyses.length > 0) {
    const bestValue = analyses[0].totalExpectedValueForOpp
    analyses.forEach((a) => {
      a.isOptimal = a.totalExpectedValueForOpp === bestValue
    })
  }

  return analyses
}

/**
 * Internal helper to find optimal attacker pair for us.
 * Duplicated logic to avoid circular dependency issues.
 */
function findOptimalAttackerPairForUsInternal(
  matrix: number[][],
  oppDefender: number,
  ourAttackers: number[]
): [number, number] {
  if (ourAttackers.length <= 2) {
    return [ourAttackers[0], ourAttackers[1] ?? ourAttackers[0]]
  }

  let bestPair: [number, number] = [ourAttackers[0], ourAttackers[1]]
  let bestMinScore = -Infinity

  for (let i = 0; i < ourAttackers.length; i++) {
    for (let j = i + 1; j < ourAttackers.length; j++) {
      const score1 = matrix[ourAttackers[i]][oppDefender]
      const score2 = matrix[ourAttackers[j]][oppDefender]
      const minScore = Math.min(score1, score2)

      if (minScore > bestMinScore) {
        bestMinScore = minScore
        bestPair = [ourAttackers[i], ourAttackers[j]]
      }
    }
  }

  return bestPair
}

// ============================================================================
// Payoff Matrix Construction
// ============================================================================

/**
 * Build the payoff matrix for defender selection.
 * Each cell represents the expected total score if we choose row defender
 * and opponent chooses column defender.
 *
 * @param matrix - The matchup matrix
 * @param ourRemaining - Our available players
 * @param oppRemaining - Opponent's available players
 * @returns 2D array where result[i][j] = expected score for ourRemaining[i] vs oppRemaining[j]
 */
export function buildDefenderPayoffMatrix(
  matrix: number[][],
  ourRemaining: number[],
  oppRemaining: number[]
): number[][] {
  const n = ourRemaining.length

  // Special case: 1 player each - direct matchup (no attacker exchange)
  if (n === 1) {
    return [[matrix[ourRemaining[0]][oppRemaining[0]]]]
  }

  const payoffMatrix: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const ourDefender = ourRemaining[i]
      const oppDefender = oppRemaining[j]

      // Get remaining attackers (excluding defenders)
      const ourAttackers = ourRemaining.filter((p) => p !== ourDefender)
      const oppAttackers = oppRemaining.filter((p) => p !== oppDefender)

      // Need at least 1 attacker each for an exchange
      if (ourAttackers.length === 0 || oppAttackers.length === 0) {
        // Edge case: only defender, no attackers - just the forced matchup
        payoffMatrix[i][j] = matrix[ourDefender][oppDefender]
        continue
      }

      // Resolve the attacker exchange
      const roundResult = resolveAttackerExchange(
        matrix,
        ourDefender,
        oppDefender,
        ourAttackers,
        oppAttackers
      )

      // Calculate remaining players after this round
      const newOurRemaining = ourAttackers.filter(
        (p) => !roundResult.ourPairedPlayers.includes(p)
      )
      const newOppRemaining = oppAttackers.filter(
        (p) => !roundResult.oppPairedPlayers.includes(p)
      )

      // Evaluate future game state
      let futureValue: number
      if (newOurRemaining.length === 1) {
        // Final pairing (round 3)
        futureValue = matrix[newOurRemaining[0]][newOppRemaining[0]]
      } else if (newOurRemaining.length === 0) {
        // All paired (shouldn't happen in normal flow)
        futureValue = 0
      } else {
        // Recursive evaluation for remaining rounds
        const futurePayoff = buildDefenderPayoffMatrix(matrix, newOurRemaining, newOppRemaining)
        const futureEquilibrium = solveZeroSumGame(
          futurePayoff,
          newOurRemaining,
          newOppRemaining
        )
        futureValue = futureEquilibrium.value
      }

      payoffMatrix[i][j] = roundResult.totalScore + futureValue
    }
  }

  return payoffMatrix
}

// ============================================================================
// Attacker Exchange Resolution
// ============================================================================

/**
 * Resolve what happens after both defenders are known.
 * Both teams send optimal attackers, and defenders choose optimally.
 *
 * @param matrix - The matchup matrix
 * @param ourDefender - Our defender's index
 * @param oppDefender - Opponent's defender's index
 * @param ourAttackers - Our available attackers
 * @param oppAttackers - Opponent's available attackers
 * @returns The pairings and scores from this exchange
 */
export function resolveAttackerExchange(
  matrix: number[][],
  ourDefender: number,
  oppDefender: number,
  ourAttackers: number[],
  oppAttackers: number[]
): PairingRoundResult {
  // 1. Opponent sends optimal 2 attackers against our defender
  const oppSentAttackers = findOptimalAttackerPair(matrix, ourDefender, oppAttackers)

  // 2. We send optimal 2 attackers against their defender
  const ourSentAttackers = findOptimalAttackerPairForUs(matrix, oppDefender, ourAttackers)

  // 3. Our defender chooses best of the 2 sent against them (max score for us)
  const oppAtt1Score = matrix[ourDefender][oppSentAttackers[0]]
  const oppAtt2Score = matrix[ourDefender][oppSentAttackers[1]]
  const ourDefenderScore = Math.max(oppAtt1Score, oppAtt2Score)
  const oppAttackerChosen = oppAtt1Score >= oppAtt2Score ? oppSentAttackers[0] : oppSentAttackers[1]

  // 4. Their defender chooses best of our 2 (min score for us = max for them)
  const ourAtt1Score = matrix[ourSentAttackers[0]][oppDefender]
  const ourAtt2Score = matrix[ourSentAttackers[1]][oppDefender]
  const ourAttackerScore = Math.min(ourAtt1Score, ourAtt2Score)
  const ourAttackerChosen = ourAtt1Score <= ourAtt2Score ? ourSentAttackers[0] : ourSentAttackers[1]

  return {
    ourDefenderScore,
    ourAttackerScore,
    totalScore: ourDefenderScore + ourAttackerScore,
    ourPairedPlayers: [ourAttackerChosen, ourDefender],
    oppPairedPlayers: [oppAttackerChosen, oppDefender],
  }
}

/**
 * Find optimal 2 attackers for opponent to send against our defender.
 * These are the 2 that minimize our score (worst for us).
 */
function findOptimalAttackerPair(
  matrix: number[][],
  ourDefender: number,
  oppAttackers: number[]
): [number, number] {
  if (oppAttackers.length <= 2) {
    return [oppAttackers[0], oppAttackers[1] ?? oppAttackers[0]]
  }
  return findWorstMatchups(matrix, ourDefender, oppAttackers)
}

/**
 * Find optimal 2 attackers for us to send against their defender.
 * We want to maximize the minimum score (since they pick the worse one for us).
 */
function findOptimalAttackerPairForUs(
  matrix: number[][],
  oppDefender: number,
  ourAttackers: number[]
): [number, number] {
  if (ourAttackers.length <= 2) {
    return [ourAttackers[0], ourAttackers[1] ?? ourAttackers[0]]
  }

  let bestPair: [number, number] = [ourAttackers[0], ourAttackers[1]]
  let bestMinScore = -Infinity

  for (let i = 0; i < ourAttackers.length; i++) {
    for (let j = i + 1; j < ourAttackers.length; j++) {
      const score1 = matrix[ourAttackers[i]][oppDefender]
      const score2 = matrix[ourAttackers[j]][oppDefender]
      const minScore = Math.min(score1, score2)

      if (minScore > bestMinScore) {
        bestMinScore = minScore
        bestPair = [ourAttackers[i], ourAttackers[j]]
      }
    }
  }

  return bestPair
}

// ============================================================================
// Nash Equilibrium Solver for Zero-Sum Games
// ============================================================================

/**
 * Solve a zero-sum matrix game for Nash equilibrium.
 * For zero-sum games, minimax = maximin = Nash equilibrium value.
 *
 * First checks for a saddle point (pure strategy equilibrium).
 * If none exists, computes mixed strategy equilibrium.
 *
 * @param payoffMatrix - The payoff matrix (indexed by our choice, their choice)
 * @param ourChoices - Our available choices (for mapping back to indices)
 * @param oppChoices - Opponent's available choices
 * @returns The Nash equilibrium solution
 */
export function solveZeroSumGame(
  payoffMatrix: number[][],
  ourChoices: number[],
  oppChoices: number[]
): GameEquilibrium {
  const n = payoffMatrix.length
  if (n === 0) {
    return {
      value: 0,
      ourStrategy: { type: 'pure', pureChoice: undefined },
      oppStrategy: { type: 'pure', pureChoice: undefined },
      isPure: true,
    }
  }

  // Check for saddle point (pure strategy Nash equilibrium)
  const saddlePoint = findSaddlePoint(payoffMatrix)
  if (saddlePoint) {
    return {
      value: saddlePoint.value,
      ourStrategy: { type: 'pure', pureChoice: ourChoices[saddlePoint.row] },
      oppStrategy: { type: 'pure', pureChoice: oppChoices[saddlePoint.col] },
      isPure: true,
    }
  }

  // No pure equilibrium - compute minimax value
  // For small matrices, we use the maximin approach
  const rowMinima = payoffMatrix.map((row) => Math.min(...row))
  const maximin = Math.max(...rowMinima)
  const maximinRow = rowMinima.indexOf(maximin)

  // For practical purposes, recommend the maximin (most robust) pure strategy
  // Full mixed strategy computation would require linear programming
  return {
    value: maximin,
    ourStrategy: { type: 'pure', pureChoice: ourChoices[maximinRow] },
    oppStrategy: { type: 'pure', pureChoice: oppChoices[0] }, // Placeholder
    isPure: false, // Indicates no true pure equilibrium exists
  }
}

/**
 * Find a saddle point in the payoff matrix.
 * A saddle point is a cell that is:
 * - Minimum in its row (opponent's best response)
 * - Maximum in its column (our best response)
 */
function findSaddlePoint(
  matrix: number[][]
): { row: number; col: number; value: number } | null {
  const n = matrix.length
  if (n === 0 || !matrix[0]) return null

  for (let i = 0; i < n; i++) {
    // Find minimum in row i
    const rowMin = Math.min(...matrix[i])
    const colOfMin = matrix[i].indexOf(rowMin)

    // Check if this is also maximum in its column
    let isMaxInCol = true
    for (let k = 0; k < n; k++) {
      if (matrix[k][colOfMin] > rowMin) {
        isMaxInCol = false
        break
      }
    }

    if (isMaxInCol) {
      return { row: i, col: colOfMin, value: rowMin }
    }
  }

  return null
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the opponent's payoff matrix from ours.
 * In a zero-sum game on 0-20 scale: oppMatrix[j][i] = 20 - matrix[i][j]
 */
export function getOpponentMatrix(matrix: number[][]): number[][] {
  const n = matrix.length
  const m = matrix[0]?.length ?? 0
  const oppMatrix: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      oppMatrix[j][i] = 20 - matrix[i][j]
    }
  }

  return oppMatrix
}

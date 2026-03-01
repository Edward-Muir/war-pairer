/**
 * Full Game-Theoretic Pairing Algorithm
 *
 * Implements backward induction with Nash equilibrium for the UKTC pairing process.
 * This considers both teams' simultaneous defender choices as a two-player zero-sum game.
 *
 * Key insight: On a 0-20 scale, if we score X, opponent scores (20-X).
 * This makes it a zero-sum game where minimax = Nash equilibrium.
 */

import { calculateDefenderScore, findWorstMatchups } from './defenderScore';
import { solveZeroSumGame } from './equilibriumSolver';
import type { GameEquilibrium } from './equilibriumSolver';

// ============================================================================
// Memoization Cache
// ============================================================================

let memoCache: Map<
  string,
  {
    payoffMatrix: number[][];
    equilibrium: GameEquilibrium;
  }
> | null = null;

function getMemoKey(ourRemaining: number[], oppRemaining: number[]): string {
  return (
    [...ourRemaining].sort((a, b) => a - b).join(',') +
    '|' +
    [...oppRemaining].sort((a, b) => a - b).join(',')
  );
}

/** Initialize memo cache — call at start of pairing session */
export function initMemoCache(): void {
  memoCache = new Map();
}

/** Clear memo cache — call when resetting pairing session */
export function clearMemoCache(): void {
  memoCache = null;
}

// ============================================================================
// Types
// ============================================================================

/** Result of analyzing the defender selection phase */
export interface DefenderPhaseResult {
  /** Expected total score with optimal play from both sides */
  gameValue: number;
  /** Payoff matrix: payoffMatrix[ourDefender][oppDefender] = total expected score */
  payoffMatrix: number[][];
  /** Analysis for each of our defender options */
  defenderAnalyses: FullDefenderAnalysis[];
  /** Nash equilibrium solution */
  equilibrium: GameEquilibrium;
}

/** Extended defender analysis with full game tree evaluation */
export interface FullDefenderAnalysis {
  playerIndex: number;
  /** Simple defender score (second-lowest) for intuition */
  defenderScore: number;
  /** The two attackers opponent would likely send */
  worstMatchups: [number, number];
  /** Total expected value from full backward induction (minimax value) */
  gameValue: number;
  /** Whether this defender is part of the optimal strategy */
  isOptimal: boolean;
  /** Worst-case score if opponent plays optimally against this choice */
  worstCaseValue: number;
  /** Best-case score if opponent makes a mistake */
  bestCaseValue: number;
}

/** Extended attacker pair analysis with future round evaluation */
export interface FullAttackerAnalysis {
  attackers: [number, number];
  /** Score from this immediate pairing */
  expectedScore: number;
  /** Which attacker opponent will choose to face */
  forcedMatchup: number;
  /** Which attacker returns to our pool */
  refusedAttacker: number;
  /** Total expected value including all future rounds */
  totalExpectedValue: number;
  /** Whether this is the optimal choice */
  isOptimal: boolean;
}

/** Analysis of opponent's attacker pair options from their perspective */
export interface OpponentAttackerAnalysis {
  /** Opponent player indices */
  attackers: [number, number];
  /** What we score from this immediate pairing (min of the two) */
  expectedScoreForUs: number;
  /** What opponent scores from this immediate pairing (20 - ourScore) */
  expectedScoreForOpp: number;
  /** Our total expected value including future rounds */
  totalExpectedValueForUs: number;
  /** Opponent's total expected value including future rounds */
  totalExpectedValueForOpp: number;
  /** Which attacker they'd force to face our defender (lower score for us) */
  forcedMatchup: number;
  /** Whether this is their optimal choice */
  isOptimal: boolean;
}

/** Result of a single pairing round (2 pairings locked) */
interface PairingRoundResult {
  /** Score we get from our defender's matchup */
  ourDefenderScore: number;
  /** Score we get from attacking their defender */
  ourAttackerScore: number;
  /** Total score this round */
  totalScore: number;
  /** Which of our players got paired */
  ourPairedPlayers: [number, number];
  /** Which opponent players got paired */
  oppPairedPlayers: [number, number];
  /** Our attacker that opponent's defender refused (returned to pool) */
  ourRefusedAttacker: number;
  /** Opponent's attacker that our defender refused (returned to pool) */
  oppRefusedAttacker: number;
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
    const ourPlayer = ourRemaining[0];
    const oppPlayer = oppRemaining[0];
    const score = matrix[ourPlayer][oppPlayer];

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
    };
  }

  // Build the payoff matrix for all defender combinations
  const payoffMatrix = buildDefenderPayoffMatrix(matrix, ourRemaining, oppRemaining);

  // Check cache for equilibrium (may have been computed during recursive buildDefenderPayoffMatrix)
  const memoKey = getMemoKey(ourRemaining, oppRemaining);
  const memoHit = memoCache?.get(memoKey);
  const equilibrium =
    memoHit?.equilibrium ?? solveZeroSumGame(payoffMatrix, ourRemaining, oppRemaining);

  // Cache the result if not already cached
  if (!memoHit) {
    memoCache?.set(memoKey, { payoffMatrix, equilibrium });
  }

  // Build detailed analysis for each defender option
  const defenderAnalyses = ourRemaining.map((playerIdx, i) => {
    const row = payoffMatrix[i];
    const worstCase = Math.min(...row);
    const bestCase = Math.max(...row);

    // Check if this defender is part of the optimal strategy
    let isOptimal = false;
    if (equilibrium.ourStrategy.type === 'pure') {
      isOptimal = equilibrium.ourStrategy.pureChoice === playerIdx;
    } else if (equilibrium.ourStrategy.mixedProbabilities) {
      const prob = equilibrium.ourStrategy.mixedProbabilities.get(playerIdx) ?? 0;
      isOptimal = prob > 0;
    }

    return {
      playerIndex: playerIdx,
      defenderScore: calculateDefenderScore(matrix, playerIdx, oppRemaining),
      worstMatchups: findWorstMatchups(matrix, playerIdx, oppRemaining),
      gameValue: worstCase, // Minimax value for this defender
      isOptimal,
      worstCaseValue: worstCase,
      bestCaseValue: bestCase,
    };
  });

  // Sort by game value (minimax) descending
  defenderAnalyses.sort((a, b) => b.gameValue - a.gameValue);

  return {
    gameValue: equilibrium.value,
    payoffMatrix,
    defenderAnalyses,
    equilibrium,
  };
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
  const analyses: FullAttackerAnalysis[] = [];

  // Generate all possible attacker pairs
  for (let i = 0; i < ourAvailable.length; i++) {
    for (let j = i + 1; j < ourAvailable.length; j++) {
      const attacker1 = ourAvailable[i];
      const attacker2 = ourAvailable[j];

      // Opponent chooses which attacker faces their defender (picks worse for us)
      const score1 = matrix[attacker1][oppDefender];
      const score2 = matrix[attacker2][oppDefender];
      const expectedScore = Math.min(score1, score2);
      const forcedMatchup = score1 <= score2 ? attacker1 : attacker2;
      const refusedAttacker = score1 <= score2 ? attacker2 : attacker1;

      // Calculate who attacks our defender (opponent sends optimal attackers)
      const oppAttackers = findWorstMatchups(matrix, ourDefender, oppAvailable);
      const ourDefenderScore1 = matrix[ourDefender][oppAttackers[0]];
      const ourDefenderScore2 = matrix[ourDefender][oppAttackers[1]];
      const ourDefenderScore = Math.max(ourDefenderScore1, ourDefenderScore2);
      const oppAttackerChosen =
        ourDefenderScore1 >= ourDefenderScore2 ? oppAttackers[0] : oppAttackers[1];

      // Calculate remaining players after this round
      const newOurRemaining = ourAvailable.filter((p) => p !== forcedMatchup);
      const newOppRemaining = oppAvailable.filter((p) => p !== oppAttackerChosen);

      // Evaluate future rounds (with memoization)
      const futureValue = evaluateFutureGameState(matrix, newOurRemaining, newOppRemaining);

      const totalExpectedValue = expectedScore + ourDefenderScore + futureValue;

      analyses.push({
        attackers: [attacker1, attacker2],
        expectedScore,
        forcedMatchup,
        refusedAttacker,
        totalExpectedValue,
        isOptimal: false, // Will be set after sorting
      });
    }
  }

  // Sort by total expected value descending
  analyses.sort((a, b) => b.totalExpectedValue - a.totalExpectedValue);

  // Mark optimal choices (may be ties)
  if (analyses.length > 0) {
    const bestValue = analyses[0].totalExpectedValue;
    analyses.forEach((a) => {
      a.isOptimal = a.totalExpectedValue === bestValue;
    });
  }

  return analyses;
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
  const analyses: OpponentAttackerAnalysis[] = [];

  // Generate all possible opponent attacker pairs
  for (let i = 0; i < oppAvailable.length; i++) {
    for (let j = i + 1; j < oppAvailable.length; j++) {
      const oppAttacker1 = oppAvailable[i];
      const oppAttacker2 = oppAvailable[j];

      // Our defender chooses which opponent attacker to face (picks higher score for us)
      const score1 = matrix[ourDefender][oppAttacker1];
      const score2 = matrix[ourDefender][oppAttacker2];
      const expectedScoreForUs = Math.min(score1, score2); // They pick worse for us
      const expectedScoreForOpp = 20 - expectedScoreForUs;
      const forcedMatchup = score1 <= score2 ? oppAttacker1 : oppAttacker2;
      const oppAttackerChosen = score1 <= score2 ? oppAttacker1 : oppAttacker2;

      // Calculate who we send against their defender (our optimal attackers)
      const ourSentAttackers = findOptimalAttackerPairForUsInternal(
        matrix,
        oppDefender,
        ourAvailable
      );
      const ourAtt1Score = matrix[ourSentAttackers[0]][oppDefender];
      const ourAtt2Score = matrix[ourSentAttackers[1]][oppDefender];
      const ourAttackerScore = Math.min(ourAtt1Score, ourAtt2Score);
      const ourAttackerChosen =
        ourAtt1Score <= ourAtt2Score ? ourSentAttackers[0] : ourSentAttackers[1];

      // Calculate remaining players after this round
      const newOurRemaining = ourAvailable.filter((p) => p !== ourAttackerChosen);
      const newOppRemaining = oppAvailable.filter((p) => p !== oppAttackerChosen);

      // Calculate our defender's score in this exchange
      const ourDefenderScore = Math.max(score1, score2);

      // Evaluate future rounds (with memoization)
      const futureValueForUs = evaluateFutureGameState(matrix, newOurRemaining, newOppRemaining);

      // Total value for us from this round onwards
      const totalExpectedValueForUs = ourDefenderScore + ourAttackerScore + futureValueForUs;

      // Number of remaining pairings: 2 for current round + 1 per remaining player pair
      const numRemainingPairings = 2 + newOurRemaining.length;

      // Convert to opponent's perspective (zero-sum: total points = 20 * numPairings)
      const totalExpectedValueForOpp = 20 * numRemainingPairings - totalExpectedValueForUs;

      analyses.push({
        attackers: [oppAttacker1, oppAttacker2],
        expectedScoreForUs,
        expectedScoreForOpp,
        totalExpectedValueForUs,
        totalExpectedValueForOpp,
        forcedMatchup,
        isOptimal: false,
      });
    }
  }

  // Sort by opponent's total expected value descending (best for them first)
  analyses.sort((a, b) => b.totalExpectedValueForOpp - a.totalExpectedValueForOpp);

  // Mark optimal choices (may be ties)
  if (analyses.length > 0) {
    const bestValue = analyses[0].totalExpectedValueForOpp;
    analyses.forEach((a) => {
      a.isOptimal = a.totalExpectedValueForOpp === bestValue;
    });
  }

  return analyses;
}

// ============================================================================
// Defender Choice Evaluation (at defender-choose phase)
// ============================================================================

/** Analysis of a single defender choice option */
export interface DefenderChoiceAnalysis {
  /** The opponent attacker our defender would face */
  chosenOppAttacker: number;
  /** Immediate score from our defender vs chosen attacker */
  immediateScore: number;
  /** Total expected score (immediate + opponent defender matchup + future rounds) */
  totalExpectedScore: number;
  /** Whether this is the recommended choice (strictly best total) */
  isRecommended: boolean;
}

/**
 * Evaluate the total expected score for each choice our defender can make
 * at the defender-choose phase. Uses backward induction to account for
 * the impact on future rounds, not just the immediate matchup score.
 *
 * @param matrix - The matchup matrix
 * @param ourDefender - Index of our defender
 * @param oppDefender - Index of opponent's defender
 * @param ourAttackers - Our two attacker indices
 * @param oppAttackers - Opponent's two attacker indices sent against our defender
 * @param ourRemainingPool - All our remaining player indices (including defender + attackers)
 * @param oppRemainingPool - All opponent remaining player indices (including defender + attackers)
 * @returns Analysis for each opponent attacker choice, sorted by total expected score descending
 */
export function evaluateDefenderChoices(
  matrix: number[][],
  ourDefender: number,
  oppDefender: number,
  ourAttackers: [number, number],
  oppAttackers: [number, number],
  ourRemainingPool: number[],
  oppRemainingPool: number[]
): DefenderChoiceAnalysis[] {
  // Opponent's defender choice is invariant to our choice (simultaneous, independent player sets)
  const ourAtt1Score = matrix[ourAttackers[0]][oppDefender];
  const ourAtt2Score = matrix[ourAttackers[1]][oppDefender];
  const oppDefenderScore = Math.min(ourAtt1Score, ourAtt2Score);
  const chosenOurAttacker = ourAtt1Score <= ourAtt2Score ? ourAttackers[0] : ourAttackers[1];

  const analyses: DefenderChoiceAnalysis[] = oppAttackers.map((chosenOppAttacker) => {
    const immediateScore = matrix[ourDefender][chosenOppAttacker];

    // Remaining pools after both pairings are locked:
    // Remove ourDefender and the our attacker that opponent's defender chose
    // Remove oppDefender and the opp attacker that our defender chose
    const newOurRemaining = ourRemainingPool.filter(
      (p) => p !== ourDefender && p !== chosenOurAttacker
    );
    const newOppRemaining = oppRemainingPool.filter(
      (p) => p !== oppDefender && p !== chosenOppAttacker
    );

    // Evaluate future rounds (with memoization)
    const futureValue = evaluateFutureGameState(matrix, newOurRemaining, newOppRemaining);

    const totalExpectedScore = immediateScore + oppDefenderScore + futureValue;

    return {
      chosenOppAttacker,
      immediateScore,
      totalExpectedScore,
      isRecommended: false, // Set after sorting
    };
  });

  // Sort by total expected score descending
  analyses.sort((a, b) => b.totalExpectedScore - a.totalExpectedScore);

  // Mark recommended only if strictly best (no badge on ties)
  if (analyses.length >= 2 && analyses[0].totalExpectedScore > analyses[1].totalExpectedScore) {
    analyses[0].isRecommended = true;
  }

  return analyses;
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
    return [ourAttackers[0], ourAttackers[1] ?? ourAttackers[0]];
  }

  let bestPair: [number, number] = [ourAttackers[0], ourAttackers[1]];
  let bestMinScore = -Infinity;

  for (let i = 0; i < ourAttackers.length; i++) {
    for (let j = i + 1; j < ourAttackers.length; j++) {
      const score1 = matrix[ourAttackers[i]][oppDefender];
      const score2 = matrix[ourAttackers[j]][oppDefender];
      const minScore = Math.min(score1, score2);

      if (minScore > bestMinScore) {
        bestMinScore = minScore;
        bestPair = [ourAttackers[i], ourAttackers[j]];
      }
    }
  }

  return bestPair;
}

// ============================================================================
// Future Game State Evaluation (with memoization)
// ============================================================================

/**
 * Evaluate the expected total score for remaining players in future rounds.
 * Handles all base cases (0 remaining, 1 remaining) and recursion with memoization.
 */
function evaluateFutureGameState(
  matrix: number[][],
  ourRemaining: number[],
  oppRemaining: number[]
): number {
  if (ourRemaining.length === 0) return 0;
  if (ourRemaining.length === 1) {
    return matrix[ourRemaining[0]][oppRemaining[0]];
  }

  const key = getMemoKey(ourRemaining, oppRemaining);
  const cached = memoCache?.get(key);
  if (cached) return cached.equilibrium.value;

  const payoff = buildDefenderPayoffMatrix(matrix, ourRemaining, oppRemaining);
  const eq = solveZeroSumGame(payoff, ourRemaining, oppRemaining);
  memoCache?.set(key, { payoffMatrix: payoff, equilibrium: eq });
  return eq.value;
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
  const n = ourRemaining.length;

  // Special case: 1 player each - direct matchup (no attacker exchange)
  if (n === 1) {
    return [[matrix[ourRemaining[0]][oppRemaining[0]]]];
  }

  // Check memoization cache
  const memoKey = getMemoKey(ourRemaining, oppRemaining);
  const cached = memoCache?.get(memoKey);
  if (cached) return cached.payoffMatrix;

  const payoffMatrix: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const ourDefender = ourRemaining[i];
      const oppDefender = oppRemaining[j];

      // Get remaining attackers (excluding defenders)
      const ourAttackers = ourRemaining.filter((p) => p !== ourDefender);
      const oppAttackers = oppRemaining.filter((p) => p !== oppDefender);

      // Need at least 1 attacker each for an exchange
      if (ourAttackers.length === 0 || oppAttackers.length === 0) {
        // Edge case: only defender, no attackers - just the forced matchup
        payoffMatrix[i][j] = matrix[ourDefender][oppDefender];
        continue;
      }

      // Resolve the attacker exchange
      const roundResult = resolveAttackerExchange(
        matrix,
        ourDefender,
        oppDefender,
        ourAttackers,
        oppAttackers
      );

      // Calculate remaining players after this round
      const newOurRemaining = ourAttackers.filter((p) => !roundResult.ourPairedPlayers.includes(p));
      const newOppRemaining = oppAttackers.filter((p) => !roundResult.oppPairedPlayers.includes(p));

      // Evaluate future game state (with memoization)
      const futureValue = evaluateFutureGameState(matrix, newOurRemaining, newOppRemaining);

      payoffMatrix[i][j] = roundResult.totalScore + futureValue;
    }
  }

  return payoffMatrix;
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
  const oppSentAttackers = findOptimalAttackerPair(matrix, ourDefender, oppAttackers);

  // 2. We send optimal 2 attackers against their defender
  const ourSentAttackers = findOptimalAttackerPairForUs(matrix, oppDefender, ourAttackers);

  // 3. Our defender chooses best of the 2 sent against them (max score for us)
  const oppAtt1Score = matrix[ourDefender][oppSentAttackers[0]];
  const oppAtt2Score = matrix[ourDefender][oppSentAttackers[1]];
  const ourDefenderScore = Math.max(oppAtt1Score, oppAtt2Score);
  const oppAttackerChosen =
    oppAtt1Score >= oppAtt2Score ? oppSentAttackers[0] : oppSentAttackers[1];

  // 4. Their defender chooses best of our 2 (min score for us = max for them)
  const ourAtt1Score = matrix[ourSentAttackers[0]][oppDefender];
  const ourAtt2Score = matrix[ourSentAttackers[1]][oppDefender];
  const ourAttackerScore = Math.min(ourAtt1Score, ourAtt2Score);
  const ourAttackerChosen =
    ourAtt1Score <= ourAtt2Score ? ourSentAttackers[0] : ourSentAttackers[1];

  // Determine refused attackers (the ones not chosen by the defenders)
  const oppRefusedAttacker =
    oppAtt1Score >= oppAtt2Score ? oppSentAttackers[1] : oppSentAttackers[0];
  const ourRefusedAttacker =
    ourAtt1Score <= ourAtt2Score ? ourSentAttackers[1] : ourSentAttackers[0];

  return {
    ourDefenderScore,
    ourAttackerScore,
    totalScore: ourDefenderScore + ourAttackerScore,
    ourPairedPlayers: [ourAttackerChosen, ourDefender],
    oppPairedPlayers: [oppAttackerChosen, oppDefender],
    ourRefusedAttacker,
    oppRefusedAttacker,
  };
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
    return [oppAttackers[0], oppAttackers[1] ?? oppAttackers[0]];
  }
  return findWorstMatchups(matrix, ourDefender, oppAttackers);
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
    return [ourAttackers[0], ourAttackers[1] ?? ourAttackers[0]];
  }

  let bestPair: [number, number] = [ourAttackers[0], ourAttackers[1]];
  let bestMinScore = -Infinity;

  for (let i = 0; i < ourAttackers.length; i++) {
    for (let j = i + 1; j < ourAttackers.length; j++) {
      const score1 = matrix[ourAttackers[i]][oppDefender];
      const score2 = matrix[ourAttackers[j]][oppDefender];
      const minScore = Math.min(score1, score2);

      if (minScore > bestMinScore) {
        bestMinScore = minScore;
        bestPair = [ourAttackers[i], ourAttackers[j]];
      }
    }
  }

  return bestPair;
}

// Re-export from equilibriumSolver for backwards compatibility
export { solveZeroSumGame, getOpponentMatrix } from './equilibriumSolver';
export type { GameEquilibrium, Strategy } from './equilibriumSolver';

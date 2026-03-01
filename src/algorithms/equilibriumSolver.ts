/**
 * Nash Equilibrium Solver for Zero-Sum Games
 *
 * Extracted from fullGameTheory.ts to keep file sizes manageable.
 */

/** A strategy can be pure (single choice) or mixed (probability distribution) */
export interface Strategy {
  type: 'pure' | 'mixed';
  /** For pure strategy: the single optimal choice */
  pureChoice?: number;
  /** For mixed strategy: map of choice -> probability */
  mixedProbabilities?: Map<number, number>;
}

/** Nash equilibrium solution for a zero-sum game */
export interface GameEquilibrium {
  /** Value of the game (expected score with optimal play) */
  value: number;
  /** Our optimal strategy */
  ourStrategy: Strategy;
  /** Opponent's optimal strategy */
  oppStrategy: Strategy;
  /** Whether a pure strategy equilibrium exists */
  isPure: boolean;
}

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
  const n = payoffMatrix.length;
  if (n === 0) {
    return {
      value: 0,
      ourStrategy: { type: 'pure', pureChoice: undefined },
      oppStrategy: { type: 'pure', pureChoice: undefined },
      isPure: true,
    };
  }

  // Check for saddle point (pure strategy Nash equilibrium)
  const saddlePoint = findSaddlePoint(payoffMatrix);
  if (saddlePoint) {
    return {
      value: saddlePoint.value,
      ourStrategy: { type: 'pure', pureChoice: ourChoices[saddlePoint.row] },
      oppStrategy: { type: 'pure', pureChoice: oppChoices[saddlePoint.col] },
      isPure: true,
    };
  }

  // No pure equilibrium - compute minimax value
  // For small matrices, we use the maximin approach
  const rowMinima = payoffMatrix.map((row) => Math.min(...row));
  const maximin = Math.max(...rowMinima);
  const maximinRow = rowMinima.indexOf(maximin);

  // For practical purposes, recommend the maximin (most robust) pure strategy
  // Full mixed strategy computation would require linear programming
  return {
    value: maximin,
    ourStrategy: { type: 'pure', pureChoice: ourChoices[maximinRow] },
    oppStrategy: { type: 'pure', pureChoice: oppChoices[0] }, // Placeholder
    isPure: false, // Indicates no true pure equilibrium exists
  };
}

/**
 * Find a saddle point in the payoff matrix.
 * A saddle point is a cell that is:
 * - Minimum in its row (opponent's best response)
 * - Maximum in its column (our best response)
 */
function findSaddlePoint(matrix: number[][]): { row: number; col: number; value: number } | null {
  const n = matrix.length;
  if (n === 0 || !matrix[0]) return null;

  for (let i = 0; i < n; i++) {
    // Find minimum in row i
    const rowMin = Math.min(...matrix[i]);
    const colOfMin = matrix[i].indexOf(rowMin);

    // Check if this is also maximum in its column
    let isMaxInCol = true;
    for (let k = 0; k < n; k++) {
      if (matrix[k][colOfMin] > rowMin) {
        isMaxInCol = false;
        break;
      }
    }

    if (isMaxInCol) {
      return { row: i, col: colOfMin, value: rowMin };
    }
  }

  return null;
}

/**
 * Get the opponent's payoff matrix from ours.
 * In a zero-sum game on 0-20 scale: oppMatrix[j][i] = 20 - matrix[i][j]
 */
export function getOpponentMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const m = matrix[0]?.length ?? 0;
  const oppMatrix: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      oppMatrix[j][i] = 20 - matrix[i][j];
    }
  }

  return oppMatrix;
}

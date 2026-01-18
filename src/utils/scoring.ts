/**
 * Get Tailwind color class based on score value
 * Uses 0-20 scale where 10 is neutral
 *
 * @param score - Expected matchup score (0-20)
 * @returns Tailwind background color class
 */
export function scoreToBackgroundColor(score: number): string {
  if (score >= 15) return 'bg-green-500';
  if (score >= 13) return 'bg-green-400';
  if (score >= 11) return 'bg-green-200';
  if (score >= 9) return 'bg-gray-100';
  if (score >= 7) return 'bg-red-200';
  if (score >= 5) return 'bg-red-400';
  return 'bg-red-500';
}

/**
 * Get Tailwind text color class for score display
 * Ensures readability on colored backgrounds
 */
export function scoreToTextColor(score: number): string {
  if (score >= 15 || score < 5) return 'text-white';
  if (score >= 13 || score < 7) return 'text-gray-900';
  return 'text-gray-700';
}

/**
 * Format score for display with sign indicator
 * Shows +/- relative to neutral (10)
 */
export function formatScoreWithDelta(score: number): string {
  const delta = score - 10;
  if (delta > 0) return `${score} (+${delta})`;
  if (delta < 0) return `${score} (${delta})`;
  return `${score}`;
}

/**
 * Simple score formatting
 */
export function formatScore(score: number): string {
  return score.toFixed(0);
}

/**
 * Calculate total expected score from pairings
 */
export function calculateTotalScore(scores: number[]): number {
  return scores.reduce((sum, score) => sum + score, 0);
}

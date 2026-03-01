import { usePairingStore } from '@/store/pairingStore';

/**
 * Returns the sum of expectedScore from all locked pairings.
 * Used to normalize game-theory values to total EV across all pairings.
 */
export function useLockedTotal(): number {
  const pairings = usePairingStore((s) => s.pairings);
  return pairings.reduce((sum, p) => sum + p.expectedScore, 0);
}

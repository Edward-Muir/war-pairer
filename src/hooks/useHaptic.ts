import { useCallback, useMemo } from 'react';

type HapticPattern = 'light' | 'medium' | 'select' | 'success' | 'error';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,          // 10ms for minor tap feedback
  medium: 25,         // 25ms for button press
  select: 15,         // 15ms for selection confirmation
  success: [30, 50, 30],  // Double pulse for success
  error: [50, 30, 50, 30, 80],  // Escalating buzz for error
};

/**
 * Hook to provide haptic feedback via the Vibration API.
 * Haptics only work on Android (Chrome/Firefox). iOS Safari has limited support.
 */
export function useHaptic() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (isSupported && document.visibilityState === 'visible') {
        try {
          navigator.vibrate(pattern);
        } catch {
          // Silently fail - haptics are enhancement, not critical
        }
      }
    },
    [isSupported]
  );

  const haptics = useMemo(
    () => ({
      light: () => vibrate(HAPTIC_PATTERNS.light),
      medium: () => vibrate(HAPTIC_PATTERNS.medium),
      select: () => vibrate(HAPTIC_PATTERNS.select),
      success: () => vibrate(HAPTIC_PATTERNS.success),
      error: () => vibrate(HAPTIC_PATTERNS.error),
    }),
    [vibrate]
  );

  return { isSupported, vibrate, haptics };
}

# UX Consistency & Refined Animations

**Date:** 2026-02-22

## Problem

The pairing flow had an inconsistent selection UX:

- **Our players** were selected by tapping cards (instant highlight with `ring-2 ring-blue-500`)
- **Opponent players** were selected via dropdown/BottomSheet pickers (tap trigger → open modal → pick from list)

This created a jarring difference in interaction patterns between steps that were conceptually the same action: "select a player."

Additionally, the app had minimal animation — content appeared instantly with no transitions or feedback beyond basic CSS hover states.

## Changes Made

### 1. Unified Opponent Selection to Tap-to-Select Cards

**AttackerRevealContent.tsx** — Replaced two separate `PlayerPicker` dropdowns with a multi-select card list. Opponent players are shown as `PlayerCard` components. Tap to toggle selection (max 2). A "0 of 2 selected" counter and "Ready" indicator show progress. The Continue button activates when exactly 2 are selected.

**DefenderRevealContent.tsx** — Replaced the single `PlayerPicker` dropdown with tappable `PlayerCard` components for opponent defender selection, matching the same single-select card pattern used for our own defender selection.

### 2. Refined Card Selection Animation (Card.tsx)

- Changed from `transition-shadow` to `transition-all duration-150` for smooth ring, border, and shadow transitions on selection
- Clickable cards now use Framer Motion `motion.div` with `whileTap={{ scale: 0.98 }}` for subtle press feedback (spring: stiffness 500, damping 30)
- Static (non-clickable) cards remain plain `div`s to avoid unnecessary overhead
- Added `border-blue-300` to selected state for a more cohesive highlight

### 3. Phase Transition Animations (PairingPhasePage.tsx)

- Wrapped phase content in `AnimatePresence mode="wait"` with a 150ms opacity crossfade
- Each phase gets a unique `key={currentPhase}` so transitions fire on phase changes
- Fast enough to feel nearly instant, smooth enough to avoid jarring content swaps

### 4. Staggered List Animations

Added subtle staggered fade-in to card lists in all 5 pairing content components:
- **DefenderSelectContent** — defender option cards
- **AttackerSelectContent** — attacker pair cards
- **AttackerRevealContent** — opponent player cards
- **DefenderRevealContent** — opponent player cards
- **DefenderChooseContent** — choice cards

Animation: 40ms stagger between children, 200ms fade + 8px slide-up per card.

### 5. Haptic Feedback

Extended the existing `useHaptic` hook to all card selection interactions across the pairing flow. Calls `haptics.select()` (15ms vibration) on every card tap for tactile feedback on supported devices.

### 6. Accessibility

All animations respect `useReducedMotion` — when the user has `prefers-reduced-motion: reduce` enabled, all Framer Motion animations are skipped entirely (no scale, no stagger, no crossfade).

## Files Modified

| File | Change |
|------|--------|
| `src/components/Common/Card.tsx` | `transition-all duration-150`, `motion.div` with `whileTap` for clickable cards |
| `src/pages/PairingPhasePage.tsx` | `AnimatePresence` phase crossfade |
| `src/pages/pairing/AttackerRevealContent.tsx` | PlayerPicker → multi-select tap cards + stagger + haptic |
| `src/pages/pairing/DefenderRevealContent.tsx` | PlayerPicker → single-select tap cards + stagger + haptic |
| `src/pages/pairing/DefenderSelectContent.tsx` | Stagger animation + haptic |
| `src/pages/pairing/AttackerSelectContent.tsx` | Stagger animation + haptic |
| `src/pages/pairing/DefenderChooseContent.tsx` | Haptic feedback on selections |

## Animation Timing Reference

| Interaction | Duration | Type |
|-------------|----------|------|
| Card tap press | Spring (500/30) | `whileTap` scale 0.98 |
| Card selection ring | 150ms | CSS `transition-all` |
| List item stagger | 40ms gap, 200ms per item | Framer Motion variants |
| Phase crossfade | 150ms | Framer Motion opacity |

# Session 5: UI — Pairing Flow (Dynamic Rounds)

**Date:** 2026-03-01
**Branch:** `feature/8`
**Status:** Complete — all 82 tests pass, 0 build errors, clean production build

## Overview

Made the entire pairing flow work dynamically for any number of selection rounds, resolving all 18 build errors left from Session 3's store refactor. The app now supports both 5v5 (2 selection rounds + forced 1v1 final) and 8v8 (3 selection rounds with 4v4 auto-pairing + summary final). This is Session 5 of a 6-session implementation plan defined in `documentation/8v8-implementation-guide.md`.

## Files Modified

### `src/components/Layout/PhaseIndicator.tsx`

| Change                   | Details                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Removed hardcoded arrays | Deleted 11-element `pairingPhases` array and `phaseLabels` record                                                            |
| Dynamic phase generation | Uses `generatePairingPhases(teamSize)` from `@/store/types` — shows 11 dots for 5v5, 16 for 8v8                              |
| Dynamic labels           | `getPhaseLabel()` function parses phase strings via regex to generate labels (`Def N`, `Att N`, `Reveal`, `Choose`, `Final`) |
| Store integration        | Added `usePairingStore` import to read `teamSize`                                                                            |

### `src/pages/PairingPhasePage.tsx`

| Change                      | Details                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Removed 3 hardcoded records | Deleted `phaseRound` (10 entries), `phaseTitles` (11 entries), `previousPhaseMap` (11 entries)          |
| `getPhaseRound()` function  | Regex-based: extracts round number from phase string like `defender-3-select` → `3`                     |
| `getPhaseTitle()` function  | Builds titles dynamically from phase pattern (e.g., `Round 3: Select Defender`)                         |
| Dynamic back navigation     | Uses `generatePreviousPhaseMap(teamSize)` instead of hardcoded map                                      |
| Pattern-matched rendering   | Replaced switch statement with if/else chain using `startsWith`/`endsWith` — works for any round number |
| Store access                | Added `teamSize` to destructured store state                                                            |

### `src/pages/pairing/DefenderSelectContent.tsx`

| Change                   | Details                                                                                                                                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store migration          | `setOurDefender1`/`setOurDefender2` → `setOurDefender(round, player)`                                                                                                                                                                                 |
| Dynamic phase navigation | Hardcoded strings → `` `defender-${round}-reveal` ``                                                                                                                                                                                                  |
| Loading spinner for 8v8  | Replaced synchronous `useMemo` with `useEffect` + `useState` pattern. When `teamSize > 5 && round === 1`, defers computation via `setTimeout(0)` with `initMemoCache()` call. Shows spinning loader with "Analyzing matchups..." text while computing |
| Conditional rendering    | Player list and confirm button hidden during computation                                                                                                                                                                                              |

### `src/pages/pairing/DefenderRevealContent.tsx`

| Change                   | Details                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Store migration          | `round1`/`round2` + `setOppDefender1`/`setOppDefender2` → `getRound(round)` + `setOppDefender(round, player)` |
| Dynamic phase navigation | Hardcoded strings → `` `attacker-${round}-select` ``                                                          |

### `src/pages/pairing/AttackerSelectContent.tsx`

| Change                   | Details                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Store migration          | `round1`/`round2` + `setOurAttackers1`/`setOurAttackers2` → `getRound(round)` + `setOurAttackers(round, players)` |
| Dynamic phase navigation | Hardcoded strings → `` `attacker-${round}-reveal` ``                                                              |

### `src/pages/pairing/AttackerRevealContent.tsx`

| Change                   | Details                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Store migration          | `round1`/`round2` + `setOppAttackers1`/`setOppAttackers2` → `getRound(round)` + `setOppAttackers(round, players)` |
| Dynamic phase navigation | Hardcoded strings → `` `defender-${round}-choose` ``                                                              |

### `src/pages/pairing/DefenderChooseContent.tsx`

| Change                  | Details                                                                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store migration         | `round1`/`round2` → `getRound(round)` for all 4 state accessors (ourDefender, oppDefender, ourAttackers, oppAttackers)                                                                                                                 |
| Imports                 | Added `getSelectionRoundCount`, `isFinalSelectionRound` from `@/store/types`                                                                                                                                                           |
| `handleConfirm` rewrite | Three branches: (1) `round < selectionRounds` → next selection round, (2) 8v8 final selection round → auto-lock 4 pairings (2 standard + refused-vs-refused + uninvolved-vs-uninvolved), (3) 5v5 final → `final-pairing`               |
| 8v8 auto-pairing logic  | After locking 2 standard pairings, reads fresh store state via `usePairingStore.getState()`, identifies refused attackers (NOT chosen from each pair) and uninvolved players (remaining after refused), locks both additional pairings |
| Button text             | Dynamic: "Lock 2 Pairings" (round 1), "Lock 2 More Pairings" (mid rounds), "Lock 4 Pairings" (8v8 final), "Lock 2 More Pairings" (5v5 final)                                                                                           |

### `src/pages/pairing/FinalPairingContent.tsx`

| Change                | Details                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Dual-path detection   | `is5v5Final` (1 remaining per side) vs `is8v8Final` (0 remaining per side)                                                |
| 5v5 path              | Existing forced 1v1 behavior preserved. Round number uses `getSelectionRoundCount(teamSize) + 1` instead of hardcoded `3` |
| 8v8 path              | No `choosePairing` call (all 8 already locked). Shows "All Pairings Locked" header + summary of all 8 pairings            |
| Dynamic neutral score | `"(Neutral = 50 points)"` → `"(Neutral = {teamSize * 10} points)"` — shows 50 for 5v5, 80 for 8v8                         |
| Store access          | Added `teamSize` to destructured state                                                                                    |

## Key Decisions

- **Loading spinner only on 8v8 round 1**: The algorithm is fast enough for subsequent rounds (6v6, 4v4) thanks to memoization initialized on round 1. The `setTimeout(0)` pattern yields to the browser event loop so the spinner renders before the heavy computation begins.
- **Auto-pairing in DefenderChooseContent**: The 4v4 auto-pairing (refused + uninvolved) is handled inline in `handleConfirm` rather than as a separate phase. This keeps the phase flow clean — the user sees 2 standard pairings locked plus 2 auto-pairings, then goes straight to the final summary.
- **`usePairingStore.getState()` for fresh state**: After `choosePairing` mutates the store synchronously (removing players from remaining), we read fresh state to identify who's left. This is safe because Zustand's `set()` is synchronous.
- **`getSelectionRoundCount(teamSize) + 1` for final round number**: Instead of hardcoding `3` for the final pairing round, derive it from team size. For 5v5 this gives `3` (unchanged), for 8v8 it would give `4` (though 8v8 doesn't use this path since all pairings are locked before `final-pairing`).

## What's NOT Changed Yet (Session 6)

- **EVBadge callers in pairing content** — `totalPairings` prop not yet passed for 8v8 contexts
- **MethodologyPage / AdvancedMathSection** — still references "5v5" in explanatory text
- **Comprehensive testing** — persistence, back-from-summary edge case for 8v8, manual end-to-end verification

## Verification

- `npx tsc --noEmit` — 0 type errors (all 18 from Session 3 resolved)
- `npm run test:run` — all 82 tests pass
- `npm run build` — clean production build (476.76 KB JS bundle)

## Next Steps (Session 6)

**Polish, Methodology & Final Testing** — per `documentation/8v8-implementation-guide.md`:

- Update MethodologyPage and AdvancedMathSection text for 8v8 format
- Pass correct `totalPairings` to EVBadge for 8v8 contexts
- Comprehensive end-to-end testing: 5v5 regression, 8v8 full flow, persistence, back navigation

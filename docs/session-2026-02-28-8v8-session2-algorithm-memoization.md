# Session 2: Algorithm Memoization & 8v8 Base Cases

**Date:** 2026-02-28
**Branch:** `feature/8`
**Status:** Complete — build passes, all 82 tests pass

## Overview

Made the game-theory algorithm work for 8v8 (WTC format) with acceptable performance. Added memoization to avoid redundant sub-problem computation, tracked refused attackers for future UI use, fixed a display bug in opponent attacker analysis, and added comprehensive 8v8 tests. This is Session 2 of a 6-session implementation plan defined in `documentation/8v8-implementation-guide.md`.

## Files Modified

### `src/algorithms/fullGameTheory.ts` (830 → 858 lines)

| Change                                           | Details                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Memoization cache infrastructure                 | Added module-level `memoCache` (`Map<string, { payoffMatrix, equilibrium }>`), `getMemoKey()` (sorted player indices joined by `\|`), exported `initMemoCache()` and `clearMemoCache()` lifecycle functions. Cache is `null` by default — all operations are no-ops via optional chaining when uninitialized.                             |
| `evaluateFutureGameState` helper                 | New internal function that consolidates the 3-way future-value branch (length=0 → 0, length=1 → direct lookup, else → recurse) with integrated memoization. Replaces duplicated logic in 4 functions. Also fixes a missing `length === 0` guard in `analyzeAttackerPhase` that would have caused incorrect results for 8v8 n=2 recursion. |
| `buildDefenderPayoffMatrix` memoization          | Added cache lookup after n=1 base case (returns cached payoff matrix). Replaced 3-way future-value branch (lines 594-610) with single `evaluateFutureGameState` call.                                                                                                                                                                     |
| `analyzeDefenderPhase` memoization               | After building payoff matrix, checks cache for equilibrium computed during recursive `buildDefenderPayoffMatrix`. Caches the top-level result if not already cached. Avoids redundant `solveZeroSumGame` calls.                                                                                                                           |
| `analyzeAttackerPhase` update                    | Replaced 2-way future-value branch with `evaluateFutureGameState` call. Fixes missing `length === 0` guard needed for 8v8.                                                                                                                                                                                                                |
| `analyzeOpponentAttackerPhase` update            | Replaced 3-way future-value branch with `evaluateFutureGameState` call.                                                                                                                                                                                                                                                                   |
| `evaluateDefenderChoices` update                 | Replaced 3-way future-value branch with `evaluateFutureGameState` call.                                                                                                                                                                                                                                                                   |
| `PairingRoundResult` — refused attacker tracking | Added `ourRefusedAttacker` and `oppRefusedAttacker` fields to the interface. Populated in `resolveAttackerExchange` as the opposite of the chosen attackers. Needed by Session 5's `DefenderChooseContent` for 4v4 auto-pairing.                                                                                                          |
| `numRemainingPairings` fix                       | Replaced hardcoded `length === 1 ? 2 : length === 0 ? 1 : 3` with generic `2 + newOurRemaining.length`. Fixes a silent display bug where opponent's total expected value was consistently underestimated. Rankings/recommendations were unaffected (constant offset across all options).                                                  |

### `src/algorithms/__tests__/fullGameTheory.test.ts` (832 → 930 lines)

| Change                              | Details                                                                                                                                                                                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Memoization lifecycle               | Added `initMemoCache`/`clearMemoCache` to imports. Added `beforeEach(() => initMemoCache())` / `afterEach(() => clearMemoCache())` to top-level describe block.                                                                                                                                           |
| Monte Carlo cache fix               | Added `clearMemoCache(); initMemoCache()` inside each game loop iteration. The memo cache keys only include player indices (not matrix values), so cached results from one random matrix would pollute the next. This was causing a regression where the algorithm appeared to perform worse than random. |
| Monte Carlo sample size             | Increased from 100 to 500 games for statistical stability. At 100 games, the 55% threshold was inherently flaky.                                                                                                                                                                                          |
| New `describe('8v8 support')` suite | 8 new tests using a deterministic 8x8 test matrix with strategic variety.                                                                                                                                                                                                                                 |

#### New 8v8 Tests

1. **8-player defender analysis** — 8 analyses, 8x8 payoff matrix, equilibrium defined
2. **Performance benchmark** — Completes in <5s (actual: ~28ms with memoization)
3. **Balanced 8x8 game value** — All-10s matrix → game value = 80
4. **Memoization effectiveness** — Second call <50ms (near-instant cache hit)
5. **Intermediate states** — 6v6, 4v4, 2v2 all succeed without throwing
6. **n=2 base case** — Valid results via natural recursion, game value in [0, 40]
7. **Refused attacker fields** — Present and not in paired players
8. **8v8 vs 5v5 comparison** — Balanced 8v8 game value (80) > balanced 5v5 (50)

## Key Decisions

- **`evaluateFutureGameState` extraction**: Rather than adding memoization inline (which would violate ESLint `max-depth: 4`), extracted a helper that also eliminated code duplication across `buildDefenderPayoffMatrix`, `analyzeAttackerPhase`, `analyzeOpponentAttackerPhase`, and `evaluateDefenderChoices`.
- **No special n=2 base case**: The algorithm handles n=2 naturally through recursion. Each side picks 1 defender, 1 attacker remains, exchange resolves via `findOptimalAttackerPair`'s `length <= 2` guard, 0 remain after.
- **Cache key design**: Sorted player indices only (not matrix values). This means the cache is only valid for a single matrix/pairing session. The Monte Carlo test fix reinforced this constraint.
- **`numRemainingPairings` formula**: The generic `2 + newOurRemaining.length` works for both 5v5 and 8v8. The old hardcoded values were consistently 2 less than correct, but since the error was constant across all options in a given context, it didn't affect rankings — only the absolute `totalExpectedValueForOpp` display values were wrong.

## Regression Found & Fixed

The memoization cache, keyed only by player indices, was shared across Monte Carlo simulation iterations that each used different random matrices. Cached equilibria from matrix A were incorrectly returned for matrix B when the same player indices were queried. Fix: reset the cache between each game in the simulation loop. This wasn't a production concern (real usage always operates on a single matrix), but it caused the Monte Carlo test to fail consistently.

## What's NOT Changed Yet

- The pairing store still uses `round1`/`round2` state and 8 named setters (Session 3)
- The UI content components still reference named round accessors (Session 5)
- `initMemoCache()`/`clearMemoCache()` are not yet called by the pairing store (will be added in Session 3 or 5)

## Next Steps (Session 3)

**Pairing Store Refactor** — per `documentation/8v8-implementation-guide.md`:

- Replace `round1`/`round2` state with dynamic `rounds[]` array
- Replace 8 named setters with 4 generic ones + 1 accessor
- Update `initializeFromGame` to read `teamSize` and create correct number of round states
- Use `generatePhaseOrder(teamSize)` for dynamic phase advancement
- Update persistence and migration
- Will temporarily break UI (fixed in Session 5)

## Verification

- `npm run build` — passes (no TypeScript errors)
- `npm run test:run` — all 82 tests pass (74 existing + 8 new)
- `npm run lint` — no new issues (all 6 errors + 5 warnings are pre-existing)
- 8v8 `analyzeDefenderPhase` completes in ~28ms with memoization
- Monte Carlo: 60%+ win rate at 500 games (was flaky at 100 games due to cache bug)

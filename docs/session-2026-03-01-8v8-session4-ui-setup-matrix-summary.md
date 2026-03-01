# Session 4: UI — Team Setup, Game Setup, Matrix, Summary

**Date:** 2026-03-01
**Branch:** `feature/8`
**Status:** Complete — all 82 tests pass, no new build errors (only pre-existing Session 3 errors in 5 pairing content files)

## Overview

Updated team creation, game setup, matrix entry, and game summary UI to support both 5-player and 8-player teams. After this session, users can create 8-player teams, enter 8x8 matchup matrices, and see correct pairing counts in game summaries. This is Session 4 of a 6-session implementation plan defined in `documentation/8v8-implementation-guide.md`.

## Files Modified

### `src/pages/TeamSetupPage.tsx`

| Change                      | Details                                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Import                      | Added `TeamSize` type from `@/store/types`                                                                                                                                                         |
| `teamSize` state            | New `useState<TeamSize>` initialized from `existingTeam?.teamSize ?? 5`                                                                                                                            |
| Team format toggle          | Two-button selector ("5 Players (UKTC)" / "8 Players (WTC)") placed before Players section. Blue highlight on active selection. Disabled in edit mode to prevent changing team size after creation |
| `createDefaultPlayers` call | Changed from `createDefaultPlayers()` to `createDefaultPlayers(5)` in the new-team init path (explicit rather than relying on default)                                                             |
| `createTeam` call           | Changed `teamSize: 5` hardcoded literal to `teamSize` state variable                                                                                                                               |
| Toggle behavior             | Switching team size resets players array via `createDefaultPlayers(newSize)`                                                                                                                       |

### `src/pages/GameSetupPage.tsx`

| Change                      | Details                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Import                      | Added `useEffect` from React                                                                                                                     |
| `useEffect` for team change | When `selectedTeamId` changes, regenerates `opponentPlayers` via `createDefaultPlayers(selectedTeam.teamSize)` to match the selected team's size |

### `src/pages/MatrixEntryPage.tsx`

| Change                  | Details                                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teamSize` derivation   | Added `const teamSize = game?.ourTeam?.teamSize ?? game?.ourTeam?.players?.length ?? 5`                                                                           |
| Matrix init check       | `game?.matrix?.length === 5` → `game?.matrix?.length === teamSize`                                                                                                |
| Matrix default creation | `Array(5).fill(null).map(() => Array(5).fill(10))` → `Array(teamSize).fill(null).map(() => Array(teamSize).fill(10))` in both `useState` init and `handleAllTens` |

### `src/components/Matrix/MatrixGrid.tsx`

| Change                | Details                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Fallback scores array | `[10, 10, 10, 10, 10]` → `Array(oppTeam.length).fill(10)` (dynamic based on actual opponent team size) |
| JSDoc comment         | "5x5 matchup matrix" → "NxN matchup matrix"                                                            |

### `src/pages/GameSummaryPage.tsx`

| Change            | Details                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Session detection | `sessionPairings.length === 5` → `sessionPairings.length === (game?.ourTeam?.teamSize ?? 5)` |

## Key Decisions

- **Toggle disabled in edit mode**: Team size is a structural property that affects game format (matrix dimensions, round count). Changing it on an existing team would invalidate all associated games, so it's locked after creation.
- **Opponent players regenerated on team switch**: Rather than tracking opponent team size separately, it's always derived from the selected team. This keeps the invariant that both sides have the same number of players.
- **`teamSize` fallback chain in MatrixEntryPage**: Uses `game.ourTeam.teamSize` → `game.ourTeam.players.length` → `5` to handle any edge cases with older persisted games that might not have `teamSize`.

## What's NOT Changed Yet

- **5 pairing content components** (`DefenderSelectContent`, `DefenderRevealContent`, `AttackerSelectContent`, `AttackerRevealContent`, `DefenderChooseContent`) — still have 18 type errors from Session 3 store refactor (Session 5)
- **`PairingPhasePage.tsx`** — hardcoded `phaseRound` record and `previousPhaseMap` (Session 5)
- **`FinalPairingContent.tsx`** — hardcodes `round: 3` (Session 5)
- **`PhaseIndicator.tsx`** — not yet dynamic (Session 5)
- **EVBadge callers in pairing content** — `totalPairings` prop not yet passed for 8v8 contexts (Session 6)
- **MethodologyPage / AdvancedMathSection** — still references "5v5" in explanatory text (Session 6)

## Expected Build Errors (unchanged from Session 3)

All 18 errors are in the 5 pairing content files — same set as documented in `docs/session-2026-03-01-8v8-session3-pairing-store-refactor.md`. No new errors introduced by Session 4.

## Next Steps (Session 5)

**UI — Pairing Flow (Dynamic Rounds)** — per `documentation/8v8-implementation-guide.md`:

- Replace hardcoded `phaseRound` and `previousPhaseMap` in `PairingPhasePage.tsx` with dynamic functions
- Update all 5 content components to use `getRound(round)` accessor and generic setters
- Add loading spinner for 8v8 round 1 algorithm computation
- Handle 4v4 final round auto-pairings in `DefenderChooseContent`
- Update `FinalPairingContent` for both 5v5 (1v1 forced) and 8v8 (all locked) paths
- Make `PhaseIndicator` dynamic

## Verification

- `npm run test:run` — all 82 tests pass
- `npm run build` — type errors ONLY in the 5 expected pairing content UI files (Session 3 leftovers)

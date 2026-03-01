# Session 1: Types & Team/Game Stores for 8v8 Support

**Date:** 2026-02-28
**Branch:** `feature/8`
**Status:** Complete — build passes, all 74 tests pass

## Overview

Extended the type system and data layer to support both 5-player (UKTC) and 8-player (WTC) teams. This is Session 1 of a 6-session implementation plan defined in `documentation/8v8-implementation-guide.md`. No UI changes to the pairing flow yet — just types, stores, and minimal downstream fixes to keep the build clean.

## Files Modified

### Core Changes

| File                     | Changes                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/store/types.ts`     | Added `TeamSize` type (`5 \| 8`). Changed `Team.players` from 5-tuple to `Player[]`, added `teamSize: TeamSize`. Changed `Pairing.round` from `1 \| 2 \| 3` to `number`. Changed `Phase` to use template literals (`defender-${number}-select`, etc.). Updated `CreateTeamInput` with `teamSize` and `Player[]`. Added 6 helper functions for dynamic phase/round generation. |
| `src/store/teamStore.ts` | `createDefaultPlayers()` now accepts `teamSize` parameter (default 5), returns `Player[]` via `Array.from()`. `createTeam` passes `teamSize` through. Added persist migration (v2) to backfill `teamSize: 5` on existing teams.                                                                                                                                               |
| `src/store/gameStore.ts` | Matrix initialization uses `team.teamSize` instead of hardcoded `Array(5)`.                                                                                                                                                                                                                                                                                                   |

### Downstream Type Fixes (minimal, build-unbreaking)

| File                                          | Changes                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/TeamSetupPage.tsx`                 | Removed 5-tuple cast (`players as [Player, Player, Player, Player, Player]`). Passes `teamSize: 5` to `createTeam()` (hardcoded until Session 4 adds UI selector). |
| `src/components/Display/MatchupPreview.tsx`   | `round` prop type: `1 \| 2 \| 3` → `number`                                                                                                                        |
| `src/pages/PairingPhasePage.tsx`              | Round cast: `as 1 \| 2 \| undefined` → `as number \| undefined`                                                                                                    |
| `src/pages/pairing/DefenderSelectContent.tsx` | `round` prop: `1 \| 2` → `number`                                                                                                                                  |
| `src/pages/pairing/DefenderRevealContent.tsx` | `round` prop: `1 \| 2` → `number`                                                                                                                                  |
| `src/pages/pairing/AttackerSelectContent.tsx` | `round` prop: `1 \| 2` → `number`                                                                                                                                  |
| `src/pages/pairing/AttackerRevealContent.tsx` | `round` prop: `1 \| 2` → `number`                                                                                                                                  |
| `src/pages/pairing/DefenderChooseContent.tsx` | `round` prop: `1 \| 2` → `number`                                                                                                                                  |
| `src/store/pairingStore.ts`                   | `choosePairing` round parameter: `1 \| 2 \| 3` → `number`                                                                                                          |

## New Helper Functions (in `src/store/types.ts`)

- `getSelectionRoundCount(size)` — Returns 2 for 5v5, 3 for 8v8
- `getTotalPairings(size)` — Returns the team size (5 or 8)
- `isFinalSelectionRound(size, round)` — Whether this is the last selection round
- `generatePairingPhases(size)` — Ordered list of pairing phase strings
- `generatePhaseOrder(size)` — Full phase order including setup phases
- `generatePreviousPhaseMap(size)` — Back-navigation map for all phases

## Key Decisions

- **`Player[]` instead of tuples**: The 5-tuple type was overly restrictive and would have required a union type for 5 or 8. A plain array with runtime validation is simpler and more flexible.
- **`teamSize` on Team**: Team size is stored explicitly rather than inferred from `players.length`, making it a first-class property for format selection.
- **Persist migration**: Existing teams in localStorage get `teamSize: 5` backfilled automatically via Zustand's migration mechanism (version 2).
- **Hardcoded `teamSize: 5` in TeamSetupPage**: The team size UI selector will be added in Session 4. For now, all new teams default to 5 players.

## What's NOT Changed Yet

The pairing store still uses `round1`/`round2` state and 8 named setters (`setOurDefender1`, `setOurDefender2`, etc.). The content components still reference these directly. This is intentional — the pairing store refactor is Session 3, and content component updates are Session 5.

## Next Steps (Session 2)

**Algorithm Memoization & 8v8 Base Cases** — per `documentation/8v8-implementation-guide.md`:

- Add memoization cache to `src/algorithms/fullGameTheory.ts`
- Handle 2-player base case for 8v8 final round aftermath
- Enhance `resolveAttackerExchange` to track refused attackers
- Fix hardcoded `numRemainingPairings` formula
- Add 8v8 algorithm tests (performance, correctness, intermediate states)

## Verification

- `npm run build` — passes (no TypeScript errors)
- `npm run test:run` — all 74 tests pass
- Existing 5v5 flow is unaffected (all pairing content components still work with round 1/2)

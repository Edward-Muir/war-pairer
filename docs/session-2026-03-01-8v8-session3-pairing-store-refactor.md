# Session 3: Pairing Store Refactor

**Date:** 2026-03-01
**Branch:** `feature/8`
**Status:** Complete — all 82 tests pass, build errors confined to 5 expected UI files

## Overview

Refactored the pairing store (`src/store/pairingStore.ts`) from hardcoded `round1`/`round2` state with 8 named setters to a dynamic `rounds[]` array with 4 generic setters + 1 accessor. This enables the store to support any number of selection rounds (2 for 5v5, 3 for 8v8). This is Session 3 of a 6-session implementation plan defined in `documentation/8v8-implementation-guide.md`.

## Files Modified

### `src/store/pairingStore.ts` (317 → 313 lines)

| Change                            | Details                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imports                           | Added `TeamSize` (type), `getSelectionRoundCount`, `generatePhaseOrder` from `./types`                                                                                                                                                                                                                                                                         |
| `PairingState` interface          | Replaced `round1: RoundSelectionState` + `round2: RoundSelectionState` with `teamSize: TeamSize` + `rounds: RoundSelectionState[]`                                                                                                                                                                                                                             |
| `PairingActions` interface        | Removed 8 named setters (`setOurDefender1`, `setOurDefender2`, `setOppDefender1`, `setOppDefender2`, `setOurAttackers1`, `setOurAttackers2`, `setOppAttackers1`, `setOppAttackers2`). Added 4 generic setters (`setOurDefender`, `setOppDefender`, `setOurAttackers`, `setOppAttackers`) that take `(round: number, ...)` + `getRound(round: number)` accessor |
| `initialState`                    | Changed to `teamSize: 5`, `rounds: [initialRoundState, initialRoundState]`                                                                                                                                                                                                                                                                                     |
| `phaseOrder` const                | Deleted entirely (16-element hardcoded array for 5v5)                                                                                                                                                                                                                                                                                                          |
| `rebuildFromGame`                 | Added `teamSize: TeamSize` to return type. Reads from `game.ourTeam.teamSize ?? 5`. Defaults to `5` in null/not-found branches                                                                                                                                                                                                                                 |
| `initializeFromGame`              | Reads `teamSize` from game's team. Creates `rounds` array with `getSelectionRoundCount(teamSize)` elements via `Array.from`                                                                                                                                                                                                                                    |
| `advancePhase`                    | Replaced reference to deleted `phaseOrder` with `generatePhaseOrder(teamSize)` call                                                                                                                                                                                                                                                                            |
| 4 generic setter implementations  | Each uses immutable update: copies `rounds` array, spreads target round with updated field. `getRound` uses `rounds[round - 1]` with safe fallback                                                                                                                                                                                                             |
| Persistence `partialize`          | Persists `teamSize` + `rounds` instead of `round1` + `round2`                                                                                                                                                                                                                                                                                                  |
| Persistence `version` + `migrate` | Added `version: 2`. Migration converts old `round1`/`round2` to `{ teamSize: 5, rounds: [round1, round2] }`. Pattern follows `teamStore.ts` migration                                                                                                                                                                                                          |
| `onRehydrateStorage`              | Now also destructures and sets `teamSize` from `rebuildFromGame`                                                                                                                                                                                                                                                                                               |

## Key Decisions

- **`initialState` defaults to `teamSize: 5` with 2 rounds**: Maintains backward compatibility. The store always has a valid default even before `initializeFromGame` is called.
- **Deleted `phaseOrder` entirely rather than making it dynamic at module scope**: Since `teamSize` is runtime state, the phase order must be computed per-call inside `advancePhase`. The `generatePhaseOrder` function from `types.ts` (Session 1) handles this.
- **`getRound` fallback returns fresh empty state**: Accessing out-of-bounds round indices returns `{ ourDefender: null, ... }` rather than crashing. Graceful degradation.
- **Migration uses `Record<string, unknown>` cast**: Since the old persisted shape no longer matches any defined interface, we cast to a generic record and access `old.round1`/`old.round2` with nullish coalescing.
- **Deferred `PairingPhasePage.tsx` changes to Session 5**: Though it has hardcoded `phaseRound` and `previousPhaseMap` records, it doesn't reference `round1`/`round2` or named setters — so it has no type errors and its routing limitations only matter for 8v8 flow (Session 5).

## What's NOT Changed Yet

- **5 UI content components** still reference the old API (`round1`/`round2` destructuring, named setters) — these have 18 type errors total (Session 5)
- **`PairingPhasePage.tsx`** has hardcoded `phaseRound` record and `previousPhaseMap` — works for 5v5 but wrong for 8v8 routing (Session 5)
- **`FinalPairingContent.tsx`** hardcodes `round: 3` — semantically wrong for dynamic formats but not a type error (Session 5)
- **`PhaseIndicator.tsx`** — not yet dynamic (Session 5)
- **`initMemoCache()`/`clearMemoCache()`** not yet called by the pairing store (Session 5)

## Expected Build Errors (5 files, 18 errors)

All errors are `TS2339: Property 'X' does not exist on type 'PairingStore'`:

| File                        | Missing Properties                                            |
| --------------------------- | ------------------------------------------------------------- |
| `DefenderSelectContent.tsx` | `setOurDefender1`, `setOurDefender2`                          |
| `DefenderRevealContent.tsx` | `round1`, `round2`, `setOppDefender1`, `setOppDefender2`      |
| `AttackerSelectContent.tsx` | `round1`, `round2`, `setOurAttackers1`, `setOurAttackers2`    |
| `AttackerRevealContent.tsx` | `round1`, `round2`, `setOppAttackers1`, `setOppAttackers2`    |
| `DefenderChooseContent.tsx` | `round1`, `round2` (+ 2 implicit `any` errors from cascading) |

## Next Steps (Session 4)

**UI — Team Setup, Game Setup, Matrix, Summary** — per `documentation/8v8-implementation-guide.md`:

- Add team size selector (5/8 toggle) to `TeamSetupPage.tsx`
- Update `GameSetupPage.tsx` to generate opponent players matching team size
- Update `MatrixEntryPage.tsx` to handle dynamic matrix sizes
- Update `GameSummaryPage.tsx` for dynamic pairing counts
- Widen `MatchupPreview` round prop from `1 | 2 | 3` to `number`

## Verification

- `npm run test:run` — all 82 tests pass
- `npm run build` — type errors ONLY in the 5 expected UI files
- `npx tsc --noEmit` on store file — 0 errors (note: `tsc --noEmit` alone passes because it uses a different tsconfig than `tsc -b`)

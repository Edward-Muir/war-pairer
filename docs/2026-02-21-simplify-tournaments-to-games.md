# Simplify Tournaments to Individual Games

**Date:** 2026-02-21

## What Changed

The app was restructured from a tournament-based model (multi-round containers) to standalone individual games. Each game is now a single pairing session against one opponent — no tournament naming, round tracking, or tournament summary screens.

The core pairing flow (defender select → reveal → attacker select → reveal → defender choose → round 2 → final pairing) is unchanged.

## Why

The tournament wrapper added unnecessary complexity for the actual use case. Captains just want to set up individual games, run the pairing algorithm, and record results. The multi-round tournament organisation was overengineered.

## Data Model

**Before:** `Tournament` → contains `TournamentRound[]` → each round has opponent, matrix, pairings

**After:** Flat `Game` entity with all data in one object:

```ts
interface Game {
  id: string;
  ourTeam: Team;
  opponentTeamName: string;
  opponentPlayers: Player[];
  matrix: number[][];
  pairings: Pairing[];
  status: 'setup' | 'matrix' | 'pairing' | 'completed';
  createdAt: string;
}
```

## Routes

| Before | After |
|---|---|
| `/tournament/new` | `/game/new` |
| `/tournament/:id` | _(removed)_ |
| `/tournament/:id/round/:roundIndex/setup` | _(merged into `/game/new`)_ |
| `/tournament/:id/round/:roundIndex/matrix` | `/game/:id/matrix` |
| `/tournament/:id/round/:roundIndex/pairing/:phase` | `/game/:id/pairing/:phase` |
| `/tournament/:id/round/:roundIndex/summary` | `/game/:id/summary` |

## UI Changes

- **Home page:** "Tournaments" section replaced with "Games" section. Each game card shows team vs opponent, date/time, status badge, and a delete button.
- **Game setup:** Single page combines team selection + opponent entry (previously two separate pages: TournamentSetupPage and RoundSetupPage).
- **Game summary:** Shows "Finish Game" button instead of "Finish Tournament"/"Next Round". Actual scores remain editable. Accessible from home page by tapping a completed game.
- **Bottom nav:** Tournament tab removed. Now just Home and Settings.

## Files Created

- `src/store/gameStore.ts` — Zustand store for games (persists to `uktc-games`)
- `src/pages/GameSetupPage.tsx` — Combined team selection + opponent entry
- `src/pages/GameSummaryPage.tsx` — Game results with editable actual scores
- `src/components/Cards/GameCard.tsx` — Game card for home page list

## Files Updated

- `src/store/types.ts` — Replaced tournament types with `Game`, `GameStatus`, `CreateGameInput`; updated `Phase` type
- `src/store/pairingStore.ts` — `gameId` replaces `tournamentId` + `roundIndex`
- `src/store/index.ts` — Exports `useGameStore` instead of `useTournamentStore`
- `src/pages/MatrixEntryPage.tsx` — Uses game store, simplified URL params
- `src/pages/PairingPhasePage.tsx` — Simplified URL params (no `roundIndex`)
- `src/pages/HomePage.tsx` — Games section with delete/date, "New Game" button
- `src/components/Layout/BottomNav.tsx` — Removed Tournament tab
- `src/components/Cards/index.ts` — Updated barrel exports
- `src/components/Display/index.ts` — Removed deleted component exports
- `src/utils/export.ts` — Tournament references replaced with Game
- `src/utils/scoring.ts` — Removed `calculateTournamentTotals`
- `src/App.tsx` — New `/game/...` routes

## Files Deleted

- `src/pages/TournamentSetupPage.tsx`
- `src/pages/RoundSetupPage.tsx`
- `src/pages/RoundSummaryPage.tsx`
- `src/pages/TournamentSummaryPage.tsx`
- `src/store/tournamentStore.ts`
- `src/components/Cards/TournamentCard.tsx`
- `src/components/Display/RoundAccordion.tsx`
- `src/components/Display/RoundIndicator.tsx`

## Verification

- `npm run build` — passes (no type errors)
- `npm run test:run` — all 68 tests pass

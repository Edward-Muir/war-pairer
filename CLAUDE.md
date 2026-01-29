# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UKTC Pairing Optimizer - A mobile-first React application for Warhammer 40K team tournament captains. Guides users through the UKTC pairing process with game-theoretic analysis to recommend optimal player matchups.

**Current Status**: Core pairing flow implemented with algorithms, stores, and phase-based UI.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4 (using `@tailwindcss/vite` plugin, not config file)
- Zustand for state management (with persist middleware for localStorage)
- React Router v7 for navigation
- Path alias: `@/` maps to `src/`

## Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Type check + production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
npm test         # Run tests in watch mode (Vitest)
npm run test:run # Run tests once
```

## Architecture

### Core Data Flow

1. **TeamStore** - Persistent team management (players, factions)
2. **TournamentStore** - Tournament tracking with multiple rounds
3. **PairingStore** - Current pairing session state (phases, selections)

All stores use Zustand's persist middleware for localStorage persistence.

### Pairing Algorithm

The app implements game-theoretic optimal pairing:
- **Defender Score**: Second-lowest value in a player's matchup row (guarantees best outcome against optimal attacker pair)
- **Attacker Analysis**: Evaluate all possible attacker pairs against opponent's defender
- Algorithms live in `src/algorithms/`

### Application Phases

```
home → team-setup → tournament-setup → round-setup → matrix-entry →
defender-1-select → defender-1-reveal → attacker-1-select → attacker-1-reveal →
defender-1-choose → defender-2-select → defender-2-reveal → attacker-2-select →
attacker-2-reveal → defender-2-choose → final-pairing → round-summary
```

### Directory Structure

- `src/algorithms/` - Pairing algorithms with `__tests__/`
- `src/store/` - Zustand stores (team, tournament, pairing)
- `src/pages/` - Route page components
- `src/components/` - Reusable UI organized by category (Cards, Inputs, Matrix, Display, Drawers, Layout, Common)
- `src/hooks/` - Custom React hooks
- `src/data/` - Constants (faction list)
- `src/utils/` - Helpers (scoring, export/import)

## Key Implementation Details

### Matrix Entry

5x5 matchup matrix where `scores[ourIndex][oppIndex]` = expected score (0-20 scale). Pre-filled player names from team data; users only enter scores.

### Mobile-First Design

- Single-column card layouts
- 44x44px minimum touch targets
- Scrollable matrix with sticky headers
- Bottom sheet drawers for mobile

## Development Plan

See [to-do.md](to-do.md) for detailed task checklist. See [uktc-pairing-app-plan.md](uktc-pairing-app-plan.md) for complete specification including TypeScript interfaces, component architecture, and algorithm implementations.

## Skills Available

- `/react-typescript` - React 19 + TypeScript patterns (strict mode, hooks, component typing)
- `/game-feel` - Animation and "juice" best practices (timing: 100-600ms, GPU-accelerated transforms/opacity)

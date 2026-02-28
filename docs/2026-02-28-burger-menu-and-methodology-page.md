# Burger Menu & Methodology Page

**Date:** 2026-02-28

## Problem

The app had no global navigation menu — the version number was shown as plain text in the home page header, and there was no way to access informational pages. We needed a burger menu (matching the pattern from the "When?" timeline app) and a placeholder Methodology page to later explain how the pairing algorithm works.

## Changes Made

### 1. Menu Component (`src/components/Layout/Menu.tsx`)

New slide-in drawer from the right, adapted from the When? app's `Menu.tsx`:

- Framer Motion animated backdrop (`bg-black/25` overlay, opacity fade) + drawer (spring slide: damping 30, stiffness 300)
- Swipe-to-dismiss gesture support (drag right > 100px closes)
- Menu items section with a "Methodology" link (`BookOpen` icon from lucide-react)
- Version footer at the bottom: `v{APP_VERSION}` centered with `border-t` separator
- Close button (X icon) in drawer header
- Adapted styling to warpair's palette (`bg-white`, `text-gray-900`, `border-gray-200`, `text-gray-400`)
- z-index: backdrop `z-[55]`, drawer `z-[56]` (above Header's `z-40`)

### 2. Header Updated (`src/components/Layout/Header.tsx`)

- Added hamburger icon button (`Menu` from lucide-react, renamed to `MenuIcon`) in the right section
- Menu button appears on all pages, after any existing `rightAction` content
- `useState` manages menu open/close state
- Header now renders a fragment (`<>`) wrapping both `<header>` and `<Menu>`

### 3. Version Text Removed from HomePage (`src/pages/HomePage.tsx`)

- Removed `APP_VERSION` import and the `rightAction` prop from `<Layout>` — version now lives in the burger menu

### 4. Methodology Placeholder Page (`src/pages/MethodologyPage.tsx`)

- Uses `<Layout>` with `title="Methodology"`, `showBack`, `onBack={() => navigate('/')}`
- Placeholder content explaining the page will cover the pairing algorithm

### 5. Route Added (`src/App.tsx`)

- Imported `MethodologyPage` and added `<Route path="/methodology" />` under a new "Info pages" section

## Files Modified

| File                               | Change                                                 |
| ---------------------------------- | ------------------------------------------------------ |
| `src/components/Layout/Header.tsx` | Added menu button + renders `<Menu>` component         |
| `src/pages/HomePage.tsx`           | Removed version `rightAction` and `APP_VERSION` import |
| `src/App.tsx`                      | Added `/methodology` route                             |

## Files Created

| File                             | Purpose                      |
| -------------------------------- | ---------------------------- |
| `src/components/Layout/Menu.tsx` | Slide-in burger menu drawer  |
| `src/pages/MethodologyPage.tsx`  | Placeholder methodology page |

---

## Context for Methodology Page Implementation

The Methodology page should explain how the UKTC pairing algorithm works. Below is a complete reference of the algorithm internals.

### Algorithm Files

All in `src/algorithms/`:

| File                  | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `defenderScore.ts`    | Defender score calculation (second-lowest value)      |
| `attackerAnalysis.ts` | Attacker pair evaluation (maximin over pairs)         |
| `gameTree.ts`         | Simplified backward induction                         |
| `fullGameTheory.ts`   | Complete Nash equilibrium solver — the main algorithm |

Supporting utilities in `src/utils/scoring.ts` (color coding, EV conversions).

### Key Concepts

| Concept                | Definition                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zero-Sum**           | On the 0-20 Warhammer scoring scale, if you score X, opponent scores 20-X                                                                                           |
| **Defender Score**     | Second-lowest value in a player's matchup row. When opponent sends their 2 best attackers, you choose the better one — so you're guaranteed the second-lowest score |
| **Maximin**            | Maximize your minimum payoff. Used for attacker pair selection: `expectedScore = min(score1, score2)` because opponent chooses the worse matchup for you            |
| **Nash Equilibrium**   | Neither player wants to unilaterally change strategy. Found via saddle point in the payoff matrix                                                                   |
| **Saddle Point**       | A cell that is both the minimum in its row and maximum in its column — a pure strategy equilibrium                                                                  |
| **Backward Induction** | Recursively evaluate future rounds when making current decisions. Round 3 is forced (1v1), round 2 feeds into round 3, round 1 feeds into round 2                   |

### Algorithm Flow (3 Rounds, 5v5)

**Round 1 — Defender Phase:**

1. `analyzeDefenderPhase()` builds a payoff matrix: rows = our possible defenders, columns = opponent's possible defenders
2. Each cell = expected total score (this round + all future rounds, evaluated recursively)
3. `solveZeroSumGame()` finds the Nash equilibrium (saddle point or maximin)
4. Recommends the optimal defender

**Round 1 — Attacker Phase:**

1. `analyzeAttackerPhase()` evaluates all C(4,2) = 6 possible attacker pairs against opponent's defender
2. For each pair: `expectedScore = min(score1, score2)` (opponent picks the worse matchup for us)
3. Also evaluates opponent's optimal response (sending their 2 best attackers against our defender via `findWorstMatchups`)
4. Recursively evaluates remaining rounds to compute `totalExpectedValue = immediateScore + defenderScore + futureValue`
5. Pairs ranked by total expected value

**Round 1 — Defender Choice:**

1. Each defender chooses which of the 2 sent attackers to face
2. `evaluateDefenderChoices()` ranks options by total expected score including future rounds

**Rounds 2 & 3:**

- Same structure with fewer players
- Round 3 is forced (1 player remaining per side)

### Score Color Coding (`src/utils/scoring.ts`)

| Score Range | Color          | Meaning             |
| ----------- | -------------- | ------------------- |
| 15-20       | `bg-green-500` | Excellent           |
| 13-14       | `bg-green-400` | Good                |
| 11-12       | `bg-green-200` | Slight advantage    |
| 9-10        | `bg-gray-100`  | Neutral             |
| 7-8         | `bg-red-200`   | Slight disadvantage |
| 5-6         | `bg-red-400`   | Bad                 |
| 0-4         | `bg-red-500`   | Very bad            |

### Performance

With 5 players the search space is ~3,000 operations — no memoization needed.

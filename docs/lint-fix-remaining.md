# Fix ESLint Errors — Remaining 2 Files

## Context

The pre-commit hook fails due to ESLint errors. 4 of 6 files have already been fixed. The remaining 2 files need fixes before the commit can proceed.

### ESLint config (from `eslint.config.js`)

- `complexity`: error, max 15
- `max-lines`: warn, max 450 (skipBlankLines + skipComments)
- `no-console`: warn (allow warn, error)
- `react-hooks/rules-of-hooks`: error
- `react-hooks/exhaustive-deps`: warning (treated as error by lint-staged)

### Already fixed (do not touch)

- `src/algorithms/__tests__/fullGameTheory.test.ts` — console.log → console.warn
- `src/algorithms/fullGameTheory.ts` — extracted solveZeroSumGame/getOpponentMatrix/types to `src/algorithms/equilibriumSolver.ts`
- `src/pages/GameSummaryPage.tsx` — extracted ScoreSummaryCard + GameSummaryContent sub-components
- `src/pages/PairingPhasePage.tsx` — replaced if-chain with switch in renderContent

---

## File 1: `src/pages/pairing/AttackerRevealContent.tsx`

### Errors (4 total)

#### 1. `complexity: 51` (max 15)

The main `AttackerRevealContent` function has complexity 51. The JSX has many conditional branches (`&&`, `?:`, nested ternaries).

**Fix**: Extract these JSX sections into separate components within the same file:

- **"Opponent Analysis - Before Selection"** card (lines 249-265): Extract to `OpponentOptimalCard` component. Props: `oppOptimal` (the analysis object), `availableOppAttackers` (Player[]).

- **"Opponent Analysis - After Selection"** card (lines 267-304): Extract to `OpponentComparisonCard` component. Props: `comparison` object, `isForced`, `oppAttacker1`, `oppAttacker2`.

- **"Attacker Summary"** section (lines 306-354): Extract to `AttackerSummarySection` component. This section has many `&&` and `?:` branches for showing forced attacker indicators and scores. Props: `ourAttackers`, `ourDefender`, `oppDefender`, `oppAttacker1`, `oppAttacker2`, `opp1Score`, `opp2Score`, `forcedAttacker`, `expectedScore`.

#### 2. `react-hooks/rules-of-hooks` — lines 120 and 140

Two `useMemo` hooks are called AFTER an early return on line 76:

```tsx
// line 76
if (!ourDefender || !oppDefender || !ourAttackers) {
  return <div>Error...</div>;
}

// line 120 — VIOLATION: useMemo after conditional return
const oppAttackerAnalyses = useMemo(() => { ... }, [...]);

// line 140 — VIOLATION: useMemo after conditional return
const opponentComparison = useMemo(() => { ... }, [...]);
```

**Fix**: Move both `useMemo` blocks (lines 120-134 and 140-167) and the `oppOptimal` derivation (line 137) to ABOVE the early return at line 76. The memos already have internal null checks (`if (!matrix || !ourDefender || !oppDefender) return null`) so they'll safely return null when data is missing.

#### 3. `react-hooks/exhaustive-deps` — line 66

```tsx
useEffect(() => {
  if (isForced && availableOppAttackers.length === 2) {
    setSelectedIds(new Set(availableOppAttackers.map((p) => p.id)));
  }
}, [isForced, availableOppAttackerIds]); // missing availableOppAttackers
```

**Fix**: Use `availableOppAttackerIds` (already defined on line 60 as a comma-joined string) inside the effect instead of referencing `availableOppAttackers` directly:

```tsx
useEffect(() => {
  if (isForced) {
    setSelectedIds(new Set(availableOppAttackerIds.split(',')));
  }
}, [isForced, availableOppAttackerIds]);
```

---

## File 2: `src/pages/pairing/DefenderRevealContent.tsx`

### Errors (1 total)

#### 1. `complexity: 26` (max 15)

The `DefenderRevealContent` function has complexity 26 due to many conditional JSX branches.

**Fix**: Extract these JSX sections into separate components within the same file:

- **"Opponent Analysis" cards** (lines 158-211): Two conditional cards — one shown before selection (`oppOptimal && !selectedOppDefender`), one shown after (`opponentComparison && selectedOppDefender`). Extract to `OpponentDefenderAnalysis` component. Props: `oppOptimal`, `selectedOppDefender`, `opponentComparison`, `oppRemaining`.

- **"Best Attacker Pair Preview"** section (lines 246-279): Extract to `BestAttackerPairPreview` component. Props: `selectedOppDefender`, `bestPairAnalysis`, `bestPairPlayers`.

---

## Verification

```bash
# Check only the affected files
npx eslint src/pages/pairing/AttackerRevealContent.tsx src/pages/pairing/DefenderRevealContent.tsx

# Full checks
npm run build
npm run test:run
```

All extracted sub-components should be defined in the same file as their parent component (not in new files). Keep the existing behavior and JSX exactly the same — only move code into sub-components to reduce complexity scores.

# Unified Score Selector Plan

## Goal

Unify ALL score selection UI to use the same 3x7 colored grid popover. No more +/- steppers for expected scores.

## Current Problem

Two different UIs exist for entering scores:

1. **Matrix cells** → `ScorePickerPopover` (3x7 colored grid) ✓ Good
2. **MatrixRowEditor (pencil icon)** → `ScoreInput` with +/- steppers ✗ Different experience

When you tap a matrix cell, you see the nice colored grid. But when you tap the pencil icon and try to edit scores in the row editor, you see +/- buttons instead. This is inconsistent.

## Solution

Replace `ScoreInput` in MatrixRowEditor with `ScorePickerCell` + `ScorePickerPopover` - the exact same components used by MatrixGrid.

---

## Changes

### 1. Update MatrixRowEditor to Use ScorePickerCell + Popover

**File:** `src/components/Matrix/MatrixRowEditor.tsx`

Replace `ScoreInput` with the same pattern used in MatrixGrid:
- Use `ScorePickerCell` for each opponent's score display (colored cell)
- Add state to track active cell: `activeCell: { oppIndex: number; rect: DOMRect } | null`
- Render single `ScorePickerPopover` at component level
- Tap cell → popover appears near it → select score → closes

**Before:**
```tsx
<ScoreInput
  value={scores[oppIndex] ?? 10}
  onChange={(score) => onScoreChange(oppIndex, score)}
  size="lg"
  showColorCoding={true}
  enableModal={true}
/>
```

**After:**
```tsx
<ScorePickerCell
  value={scores[oppIndex] ?? 10}
  onTap={(rect) => setActiveCell({ oppIndex, rect })}
/>

// At component level (outside the map):
<ScorePickerPopover
  isOpen={activeCell !== null}
  value={activeCell ? scores[activeCell.oppIndex] ?? 10 : 10}
  targetRect={activeCell?.rect ?? null}
  onSelect={handleScoreSelect}
  onClose={() => setActiveCell(null)}
/>
```

**New state and handler:**
```tsx
const [activeCell, setActiveCell] = useState<{ oppIndex: number; rect: DOMRect } | null>(null);

const handleScoreSelect = (score: number) => {
  if (activeCell) {
    onScoreChange(activeCell.oppIndex, score);
    setActiveCell(null);
  }
};
```

### 2. Delete ScorePickerSheet (No Longer Needed)

**File:** `src/components/Inputs/ScorePickerSheet.tsx`

- DELETE this file entirely - we're using ScorePickerPopover everywhere now

### 3. Simplify ScoreInput (Remove Modal Feature)

**File:** `src/components/Inputs/ScoreInput.tsx`

- Remove `enableModal` prop
- Remove `ScorePickerSheet` import
- Remove all modal-related state and handlers
- Keep only the +/- stepper functionality (still used on RoundSummaryPage for actual scores)

### 4. Update Exports

**File:** `src/components/Inputs/index.ts`

- Remove `ScorePickerSheet` export
- Add `ScorePickerCell` export (check if already present)

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/Matrix/MatrixRowEditor.tsx` | MODIFY - Use ScorePickerCell + ScorePickerPopover |
| `src/components/Inputs/ScorePickerSheet.tsx` | DELETE |
| `src/components/Inputs/ScoreInput.tsx` | MODIFY - Remove modal feature |
| `src/components/Inputs/index.ts` | MODIFY - Update exports |

---

## Key Components Reference

- **ScorePickerCell** (`src/components/Inputs/ScorePickerCell.tsx`) - Compact colored cell that reports DOMRect on tap
- **ScorePickerPopover** (`src/components/Inputs/ScorePickerPopover.tsx`) - Portal-based 3x7 grid positioned near target

---

## Result

**Everywhere you enter an expected score (0-20), you see the same UI:**
1. Tap a colored cell showing the current value
2. 3x7 grid popover appears near the tapped cell
3. Tap a value to select it
4. Popover closes

Consistent experience across:
- Matrix grid cells (direct tap)
- Row editor (pencil icon → bottom sheet → tap score)

---

## Verification

1. Run `npm run dev`
2. Navigate to matrix entry page
3. Tap a matrix cell → ScorePickerPopover opens with 3x7 grid
4. Tap pencil icon on a row → MatrixRowEditor opens
5. Tap any score in the row editor → **same** ScorePickerPopover opens
6. Both use identical 52x52px colored buttons
7. Run `npm run build` to verify no TypeScript errors
8. Run `npm test` to verify tests pass

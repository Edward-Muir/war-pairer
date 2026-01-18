## 9. Development Task Checklist

This checklist breaks down all tasks into discrete items that can be completed across multiple Claude sessions. Copy this to track progress.

---

### Phase 1: Project Initialization
```
[x] 1.1  Create Vite + React + TypeScript project
         Command: npm create vite@latest uktc-pairing-optimizer -- --template react-ts
[x] 1.2  Install core dependencies
         Command: npm install zustand react-router-dom
[x] 1.3  Install dev dependencies
         Command: npm install -D tailwindcss postcss autoprefixer @types/node
[x] 1.4  Initialize Tailwind CSS
         Note: Using Tailwind v4 with @tailwindcss/vite plugin
[x] 1.5  Configure tailwind.config.js (add content paths)
         Note: Tailwind v4 uses vite plugin instead of config file
[x] 1.6  Add Tailwind directives to src/index.css
[x] 1.7  Create folder structure (see Section 8)
[x] 1.8  Set up path aliases in vite.config.ts (@/ for src/)
[x] 1.9  Create vercel.json for SPA routing
[x] 1.10 Test dev server runs: npm run dev
```

### Phase 2: Type Definitions & Store Setup
```
[x] 2.1  Create src/store/types.ts with all interfaces:
         - Player, Team, Tournament, TournamentRound
         - Pairing, MatchupMatrix, RoundSelectionState
         - Phase type union (18 phases)
[x] 2.2  Create src/store/teamStore.ts
         - teams array state
         - createTeam action
         - updateTeam action
         - deleteTeam action
         - getTeam helper
         - persist middleware with 'uktc-teams' key
[x] 2.3  Create src/store/tournamentStore.ts
         - tournaments array state
         - activeTournamentId state
         - createTournament action
         - startRound action
         - updateRoundMatrix action
         - completeRound action
         - persist middleware with 'uktc-tournaments' key
[x] 2.4  Create src/store/pairingStore.ts
         - All pairing phase state (defenders, attackers, etc.)
         - initializeFromTournament action
         - Phase transition actions
         - getOurRemaining / getOppRemaining helpers
         - persist middleware with 'uktc-current-pairing' key
[x] 2.5  Test stores in isolation (npm run build passes)
```

### Phase 3: Common Components
```
[x] 3.1  Create src/components/Common/Button.tsx
         - Variants: primary, secondary, danger
         - Sizes: sm, md, lg
         - Full-width option for mobile
[x] 3.2  Create src/components/Common/Card.tsx
         - Base card with padding, shadow, rounded corners
[x] 3.3  Create src/components/Common/Modal.tsx
         - Overlay + centered content
         - Close on backdrop click
[x] 3.4  Create src/components/Common/BottomSheet.tsx
         - Slide-up drawer for mobile
         - Drag to dismiss
[x] 3.5  Create src/components/Common/Select.tsx
         - Styled select dropdown
         - Mobile-friendly touch targets
[x] 3.6  Create src/components/Layout/Header.tsx
         - Back button (conditional)
         - Title
         - Optional action button
[x] 3.7  Create src/components/Layout/BottomNav.tsx
         - 3 tabs: Home, Tournament, Settings
         - Active state highlighting
         - Uses lucide-react icons
[x] 3.8  Create src/components/Layout/PhaseIndicator.tsx
         - Progress dots/bar for pairing phases
[x] 3.9  Create main Layout wrapper component
         - Header + main content + BottomNav
[x] 3.10 Set up React Router in App.tsx with all routes
         - Placeholder pages for all routes
```

### Phase 4: Data & Utilities
```
[x] 4.1  Create src/data/factions.ts
         - Export FACTIONS array with all 40K factions
         - Export Faction type
[x] 4.2  Create src/utils/uuid.ts
         - generateId() function using crypto.randomUUID()
[x] 4.3  Create src/utils/export.ts
         - exportToJson(data, filename) function
         - importFromJson(file) function
         - downloadFile helper
[x] 4.4  Create src/utils/scoring.ts
         - scoreToBackgroundColor(score) - returns Tailwind color class
         - scoreToTextColor(score) - text color for readability
         - formatScore(score) - display formatting
         - formatScoreWithDelta(score) - shows +/- relative to 10
         - calculateTotalScore(scores) - sum helper
```

### Phase 5: Algorithm Implementation
```
[x] 5.1  Create src/algorithms/defenderScore.ts
         - calculateDefenderScore(matrix, defenderIndex, availableOpponents)
         - findWorstMatchups(matrix, defenderIndex, availableOpponents)
         - analyzeDefenderOptions(matrix, availablePlayers, availableOpponents)
[x] 5.2  Create src/algorithms/attackerAnalysis.ts
         - analyzeAttackerPairs(matrix, oppDefenderIndex, availablePlayers)
         - Returns all pairs ranked by expected score
[x] 5.3  Create src/algorithms/gameTree.ts (optional advanced)
         - evaluateGameTree(matrix, ourRemaining, oppRemaining)
         - Recursive minimax with backward induction
[x] 5.4  Create src/algorithms/__tests__/defenderScore.test.ts
         - Test with example matrix from documentation
         - Verify Player 1 has highest defender score (10)
[x] 5.5  Create src/algorithms/__tests__/attackerAnalysis.test.ts
         - Test attacker pair ranking
[x] 5.6  Run tests: npm test (configure Vitest first if needed)
         Note: Vitest configured with vitest.config.ts
```

### Phase 6: Input Components
```
[x] 6.1  Create src/components/Inputs/PlayerInput.tsx
         - Name text input
         - Faction input (links to autocomplete)
         - Compact horizontal layout for lists
[x] 6.2  Create src/components/Inputs/FactionAutocomplete.tsx
         - Text input with dropdown suggestions
         - Filters FACTIONS array on typing
         - Mobile-friendly dropdown
[x] 6.3  Create src/components/Inputs/ScoreInput.tsx
         - Number display (large, centered)
         - +/- buttons on sides
         - Optional: tap to open number pad modal
         - Constrain 0-20 range
[x] 6.4  Create src/components/Inputs/PlayerPicker.tsx
         - Dropdown or modal to select from player list
         - Shows name + faction
         - Used for revealing opponent choices
```

### Phase 7: Card Components
```
[x] 7.1  Create src/components/Cards/PlayerCard.tsx
         - Player name + faction display
         - Optional score badge
         - Selected state styling
         - onClick handler
[x] 7.2  Create src/components/Cards/DefenderCard.tsx
         - Extends PlayerCard
         - Shows DefenderScore prominently
         - Shows "worst matchups" preview
         - "Recommended" badge for optimal choice
         - Rank number (#1, #2, etc.)
[x] 7.3  Create src/components/Cards/AttackerPairCard.tsx
         - Shows two players side by side
         - Expected score badge
         - "Recommended" badge for optimal pair
[x] 7.4  Create src/components/Cards/TeamCard.tsx
         - Team name
         - Player count / faction preview
         - Edit/Delete actions (swipe or buttons)
[x] 7.5  Create src/components/Cards/TournamentCard.tsx
         - Tournament name
         - Current round indicator
         - Status badge (active/completed)
         - Continue button
```

### Phase 8: Matrix Components
```
[x] 8.1  Create src/components/Matrix/MatrixCell.tsx
         - Displays score value
         - Color-coded background (green/yellow/red)
         - Tap to edit (opens ScoreInput modal)
[x] 8.2  Create src/components/Matrix/MatrixGrid.tsx
         - 5x5 grid of MatrixCell components
         - Sticky row headers (our players)
         - Sticky column headers (opponent players)
         - Horizontal + vertical scroll on mobile
[x] 8.3  Create src/components/Matrix/MatrixRowEditor.tsx
         - Alternative: edit one row at a time
         - Vertical list with larger inputs for mobile
         - Uses BottomSheet for mobile-friendly presentation
```

### Phase 9: Display Components
```
[x] 9.1  Create src/components/Display/ScoreBadge.tsx
         - Rounded badge with score number
         - Color variants based on score value
         - Size variants (sm, md, lg)
         - Optional delta display (+2, -3)
[x] 9.2  Create src/components/Display/RecommendedBadge.tsx
         - "✓ Recommended" or "Optimal" label
         - Green accent color
         - Optional checkmark icon
[x] 9.3  Create src/components/Display/RoundIndicator.tsx
         - "Round 2 of 5" text display
         - Optional progress bar
[x] 9.4  Create src/components/Display/MatchupPreview.tsx
         - Shows "Player A vs Player B"
         - Expected score
         - Used in locked pairings display
         - Compact and full variants
```

### Phase 10: Drawer Components
```
[x] 10.1 Create src/components/Drawers/LockedPairingsDrawer.tsx
         - BottomSheet that shows all locked pairings
         - Running total expected score
         - Uses MatchupPreview in compact mode
[x] 10.2 Create src/components/Drawers/TeamPreviewDrawer.tsx
         - Shows full team roster
         - Read-only display
         - Used on RoundSetupPage for "our team"
```

### Phase 11: Home & Team Pages
```
[x] 11.1 Create src/pages/HomePage.tsx
         - "My Teams" section with TeamCard list
         - "Create New Team" button
         - "Tournaments" section with TournamentCard list
         - "New Tournament" button
         - Empty states for no teams/tournaments
         - "Resume Pairing" prompt if incomplete session exists
[x] 11.2 Create src/pages/TeamSetupPage.tsx
         - Team name input at top
         - List of 5 PlayerInput components
         - "Save Team" button
         - Validation: all fields required
         - Edit mode: pre-populate from existing team
[x] 11.3 Wire up routes: / (home), /team/new, /team/:id/edit
[x] 11.4 Test: Create team, see it on home, edit it, delete it
```

### Phase 12: Tournament Setup Pages
```
[x] 12.1 Create src/pages/TournamentSetupPage.tsx
         - Tournament name input
         - Number of rounds selector (default 5)
         - Team selector dropdown (from saved teams)
         - Selected team preview
         - "Start Tournament" button
[x] 12.2 Create src/pages/RoundSetupPage.tsx
         - RoundIndicator at top ("Round 1 of 5")
         - "Our Team" collapsible section (read-only)
         - Opponent team name input
         - 5 PlayerInput components for opponent
         - "Continue to Matrix" button
[x] 12.3 Wire up routes: /tournament/new, /tournament/:id/round/:num/setup
[x] 12.4 Test: Create tournament, enter round 1 opponent details
```

### Phase 13: Matrix Entry Page
```
[x] 13.1 Create src/pages/MatrixEntryPage.tsx
         - MatrixGrid component (pre-filled headers)
         - Quick-fill buttons: "All 10s", "Reset"
         - "Start Pairing" button
         - Save matrix to tournament store on continue
[x] 13.2 Add cell edit modal (tap cell → ScoreInput in modal)
         Note: Already implemented via MatrixCell + ScoreInput enableModal
[x] 13.3 Wire up route: /tournament/:id/round/:num/matrix
         Note: Route already existed, replaced placeholder with real component
[x] 13.4 Test: Enter matrix values, verify persistence
         - Build passes (npm run build)
         - Lint passes (npm run lint)
```

### Phase 14: Pairing Phase Pages - Round 1
```
[x] 14.1 Create src/pages/DefenderSelectPage.tsx
         - List of DefenderCard components (all 5 players)
         - Sorted by defender score (best first)
         - Selection state management
         - "Confirm Defender" button
         - Save selection to pairing store
         Note: Implemented as src/pages/pairing/DefenderSelectContent.tsx
[x] 14.2 Create src/pages/DefenderRevealPage.tsx
         - Show our defender choice
         - PlayerPicker for opponent's defender
         - Side-by-side comparison display
         - "Continue" button
         Note: Implemented as src/pages/pairing/DefenderRevealContent.tsx
[x] 14.3 Create src/pages/AttackerSelectPage.tsx
         - Show opponent's defender as "target"
         - List of AttackerPairCard components (6 pairs from 4 players)
         - Sorted by expected score
         - Selection state
         - "Confirm Attackers" button
         Note: Implemented as src/pages/pairing/AttackerSelectContent.tsx
[x] 14.4 Create src/pages/AttackerRevealPage.tsx
         - Show our attacker pair
         - Two PlayerPickers for opponent's attackers
         - "Continue" button
         Note: Implemented as src/pages/pairing/AttackerRevealContent.tsx
[x] 14.5 Create src/pages/DefenderChoosePage.tsx
         - Our defender section:
           - Show 2 opponent attackers sent against us
           - Expected score for each matchup
           - Select which to face
         - Opponent defender section:
           - Show our 2 attackers
           - PlayerPicker for which one opponent chose
         - "Lock Pairings" button
         - Save 2 pairings to store
         Note: Implemented as src/pages/pairing/DefenderChooseContent.tsx
[x] 14.6 Wire up routes for all Round 1 phases
         Note: PairingPhasePage.tsx routes to content components based on :phase param
[x] 14.7 Test: Complete full Round 1 pairing flow
         Note: Build and lint pass, manual testing recommended
```

### Phase 15: Pairing Phase Pages - Round 2
```
[x] 15.1 Adapt DefenderSelectPage for 3 remaining players
         - Filter to only show remaining players
         - Same logic, smaller list
         Note: DefenderSelectContent handles both rounds via `round` prop
[x] 15.2 Adapt AttackerSelectPage for forced selection
         - Only 2 players remain = only 1 possible pair
         - Show confirmation rather than selection
         Note: AttackerSelectContent auto-selects when isForced=true
[x] 15.3 Adapt DefenderChoosePage for Round 2
         - Same structure, updated player pools
         Note: DefenderChooseContent handles both rounds via `round` prop
[x] 15.4 Create src/pages/FinalPairingPage.tsx
         - Show forced matchup (last 2 players)
         - Display expected score
         - "Complete Pairing" button
         Note: Implemented as src/pages/pairing/FinalPairingContent.tsx
[x] 15.5 Wire up routes for Round 2 + final phases
         Note: PairingPhasePage.tsx handles all phases
[x] 15.6 Test: Complete full Round 2 + final pairing
         Note: Build and lint pass, manual testing recommended
```

### Phase 16: Summary Pages
```
[ ] 16.1 Create src/pages/RoundSummaryPage.tsx
         - Table of all 5 pairings
         - Expected score per pairing
         - Total expected score
         - Optional: Actual score inputs (post-game)
         - "Next Round" button (if rounds remain)
         - "Finish Tournament" button (if last round)
         - Save pairings to tournament store
[ ] 16.2 Create src/pages/TournamentSummaryPage.tsx
         - Accordion/list of all rounds
         - Per-round expected vs actual scores
         - Total tournament score
         - "Export Results" button
         - "New Tournament" button
         - "Back to Home" button
[ ] 16.3 Wire up routes: /tournament/:id/round/:num/summary, /tournament/:id/summary
[ ] 16.4 Test: Complete full tournament (all 5 rounds)
```

### Phase 17: Navigation & Flow Polish
```
[ ] 17.1 Implement back button logic for all pages
         - Context-aware: goes to logical previous step
         - Confirmation modal if abandoning pairing
[ ] 17.2 Add phase indicator to pairing pages
         - Show progress through 11 pairing phases
[ ] 17.3 Add LockedPairingsDrawer to pairing pages
         - Toggle button in header
         - Shows pairings locked so far
[ ] 17.4 Implement "Resume" functionality on HomePage
         - Detect incomplete pairing session
         - Show "Resume Pairing" card
         - Navigate to correct phase on tap
[ ] 17.5 Add confirmation modals for destructive actions
         - Delete team
         - Delete tournament
         - Abandon pairing
```

### Phase 18: Mobile Optimization
```
[ ] 18.1 Audit all touch targets (minimum 44x44px)
[ ] 18.2 Test matrix scrolling on mobile devices
[ ] 18.3 Add viewport meta tag for proper mobile scaling
[ ] 18.4 Test in iOS Safari and Chrome Android
[ ] 18.5 Add PWA manifest.json
         - name, short_name, icons
         - start_url, display: standalone
         - theme_color, background_color
[ ] 18.6 Add apple-touch-icon for iOS home screen
[ ] 18.7 Test "Add to Home Screen" on iOS and Android
```

### Phase 19: Export & Data Management
```
[ ] 19.1 Add "Export All Data" button in Settings/Home
         - Downloads JSON file with teams + tournaments
[ ] 19.2 Add "Import Data" button
         - File picker for JSON
         - Merge or replace confirmation
[ ] 19.3 Add "Clear All Data" button with confirmation
[ ] 19.4 Add export button on TournamentSummaryPage
         - Exports single tournament as JSON
```

### Phase 20: Final Testing & Deployment
```
[ ] 20.1 Full end-to-end test: new user flow
         - Create team → Create tournament → 5 rounds → Summary
[ ] 20.2 Test persistence: close browser mid-pairing, reopen
[ ] 20.3 Test on multiple devices/browsers
[ ] 20.4 Run production build: npm run build
[ ] 20.5 Test production build locally: npm run preview
[ ] 20.6 Deploy to Vercel
         - Connect GitHub repo, or
         - Manual deploy: vercel --prod
[ ] 20.7 Test deployed app on mobile device
[ ] 20.8 Share URL and gather feedback
```

---

### Quick Reference: Key Files to Create

| Priority | File | Purpose |
|----------|------|---------|
| 1 | `src/store/types.ts` | All TypeScript interfaces |
| 2 | `src/store/teamStore.ts` | Team persistence |
| 3 | `src/store/tournamentStore.ts` | Tournament persistence |
| 4 | `src/store/pairingStore.ts` | Pairing session state |
| 5 | `src/algorithms/defenderScore.ts` | Core algorithm |
| 6 | `src/algorithms/attackerAnalysis.ts` | Core algorithm |
| 7 | `src/pages/HomePage.tsx` | Entry point |
| 8 | `src/pages/TeamSetupPage.tsx` | Team creation |
| 9 | `src/pages/MatrixEntryPage.tsx` | Score input |
| 10 | `src/pages/DefenderSelectPage.tsx` | Key pairing page |

---

## 10. Development Phases (Summary)

### Phase 1: Core Setup (Day 1)
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Set up basic routing structure
- [ ] Create Layout component with bottom navigation
- [ ] Implement base store types

### Phase 2: Team Management (Day 1-2)
- [ ] Implement TeamStore with Zustand persist
- [ ] Build HomePage with teams list
- [ ] Build TeamSetupPage with player inputs
- [ ] Add FactionAutocomplete component
- [ ] Implement team CRUD operations
- [ ] Test persistence across browser sessions

### Phase 3: Tournament Setup (Day 2)
- [ ] Implement TournamentStore
- [ ] Build TournamentSetupPage
- [ ] Build RoundSetupPage (opponent entry)
- [ ] Link tournament to saved team
- [ ] Add tournament list to HomePage

### Phase 4: Matrix Entry (Day 2-3)
- [ ] Build MatrixGrid component (optimized for mobile)
- [ ] Implement score input with stepper modal
- [ ] Pre-populate row/column headers from team data
- [ ] Add quick-fill presets
- [ ] Create import/export JSON functionality

### Phase 5: Algorithm Implementation (Day 3)
- [ ] Implement `calculateDefenderScore()`
- [ ] Implement `analyzeDefenderOptions()`
- [ ] Implement `analyzeAttackerOptions()`
- [ ] Write unit tests for all algorithms
- [ ] Implement full game tree evaluation (optional advanced)

### Phase 6: Round 1 Flow (Day 3-4)
- [ ] Build DefenderSelectPage with recommendations
- [ ] Build DefenderRevealPage
- [ ] Build AttackerSelectPage with pair analysis
- [ ] Build AttackerRevealPage
- [ ] Build DefenderChoosePage
- [ ] Wire up state transitions
- [ ] Implement LockedPairingsDrawer

### Phase 7: Round 2 + Final (Day 4-5)
- [ ] Adapt Round 1 components for Round 2 (3 players)
- [ ] Build FinalPairingPage
- [ ] Build RoundSummaryPage
- [ ] Add actual score entry (optional)
- [ ] Implement round completion → save to tournament

### Phase 8: Tournament Flow (Day 5)
- [ ] Build TournamentSummaryPage
- [ ] Implement "Next Round" flow (back to RoundSetupPage)
- [ ] Add round history accordion
- [ ] Calculate cumulative tournament scores
- [ ] Export tournament results

### Phase 9: Polish (Day 5-6)
- [ ] Mobile optimization pass (touch targets, scrolling)
- [ ] Add animations/transitions
- [ ] Implement undo/go-back at all phases
- [ ] Error handling and edge cases
- [ ] PWA manifest for "Add to Home Screen"

### Phase 10: Deployment (Day 6)
- [ ] Configure Vercel deployment
- [ ] Set up environment variables (if any)
- [ ] Test production build
- [ ] Deploy and verify on mobile devices
- [ ] Test offline functionality

---

## 11. Testing Strategy

### 10.1 Unit Tests (Vitest)
- All algorithm functions with known inputs/outputs
- Use the example matrix from the document as test fixture
- Edge cases: tied scores, identical rows

### 10.2 Integration Tests
- Full pairing flow with mock selections
- State persistence across page reloads

### 10.3 Manual Testing Checklist
- [ ] Matrix entry with various screen sizes
- [ ] All phase transitions work correctly
- [ ] Back button works at every phase
- [ ] Locked pairings update correctly
- [ ] Final score calculation matches expectations
- [ ] Works offline after initial load

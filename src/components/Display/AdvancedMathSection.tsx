export function AdvancedMathSection() {
  return (
    <div className="mt-3 border-t border-gray-200 pt-3 space-y-5">
      {/* Zero-Sum Games */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-gray-900">Zero-Sum Games</h3>
        <p className="text-sm text-gray-600">
          A zero-sum game is one where every point gained by one player is a point lost by the
          other. Formally, for each matchup:
        </p>
        <div className="bg-gray-100 rounded p-2 font-mono text-xs text-gray-800">
          score_us + score_opp = 20
        </div>
        <p className="text-sm text-gray-600">
          For N pairings, the total always sums to 20N. This property guarantees that the minimax
          theorem applies: the optimal offensive strategy equals the optimal defensive strategy, and
          both equal the Nash equilibrium value.
        </p>
      </div>

      {/* Defender Score Formula */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-gray-900">Defender Score Formula</h3>
        <p className="text-sm text-gray-600">
          Given a player&rsquo;s matchup scores against all available opponents, sort ascending:
        </p>
        <div className="bg-gray-100 rounded p-2 font-mono text-xs text-gray-800">
          DefenderScore = sorted_scores[1]
        </div>
        <p className="text-sm text-gray-600">
          The opponent sends their 2 best counters (indices 0 and 1 in the sorted list). Our
          defender picks the better one (index 1).
        </p>
      </div>

      {/* Attacker Expected Score */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-gray-900">Attacker Expected Score</h3>
        <p className="text-sm text-gray-600">
          When sending attackers A and B against an opponent&rsquo;s defender:
        </p>
        <div className="bg-gray-100 rounded p-2 font-mono text-xs text-gray-800">
          ExpectedScore = min(score_A, score_B)
        </div>
        <p className="text-sm text-gray-600">
          The defender always picks the attacker that gives us the lower score. We evaluate all
          C(n,2) pairs and take the pair that maximises this minimum.
        </p>
      </div>

      {/* Payoff Matrix */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-gray-900">The Defender Payoff Matrix</h3>
        <p className="text-sm text-gray-600">
          Both teams choose defenders simultaneously, creating a matrix of all possible outcomes:
        </p>
        <div className="bg-gray-100 rounded p-2 font-mono text-xs text-gray-800 space-y-1">
          <div>payoffMatrix[i][j] =</div>
          <div className="ml-4">resolveExchange(ourDef_i, oppDef_j)</div>
          <div className="ml-4">+ solveGame(remainingPlayers)</div>
        </div>
        <p className="text-sm text-gray-600">
          Each cell represents the total expected score if we defend with player i and they defend
          with player j, with both teams playing optimally for all subsequent rounds. The recursive
          call evaluates all future rounds via backward induction.
        </p>
      </div>

      {/* Attacker Exchange */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-gray-900">Attacker Exchange Resolution</h3>
        <p className="text-sm text-gray-600">
          Once both defenders are fixed, the exchange is resolved in four steps:
        </p>
        <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1 ml-1">
          <li>
            Opponent sends their 2 optimal attackers against our defender (our 2 lowest scores)
          </li>
          <li>We send our 2 optimal attackers against their defender (maximise our minimum)</li>
          <li>Our defender picks the better of the 2 sent against them</li>
          <li>Their defender picks the worse of our 2 (for us)</li>
        </ol>
      </div>

      {/* Nash Equilibrium */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-gray-900">Nash Equilibrium</h3>
        <p className="text-sm text-gray-600">
          The app solves the payoff matrix to find a strategy where neither team can improve by
          unilaterally changing their defender. It first checks for a{' '}
          <strong className="text-gray-900">saddle point</strong> &mdash; a cell that is the minimum
          in its row and maximum in its column. This represents a pure strategy equilibrium.
        </p>
        <div className="bg-gray-100 rounded p-2 font-mono text-xs text-gray-800 space-y-1">
          <div>Saddle point at (i,j) if:</div>
          <div className="ml-4">payoff[i][j] = min(row_i) AND</div>
          <div className="ml-4">payoff[i][j] = max(col_j)</div>
        </div>
        <p className="text-sm text-gray-600">
          If no saddle point exists, the app uses the{' '}
          <strong className="text-gray-900">maximin</strong> strategy: for each possible defender,
          find the worst-case outcome (minimum across all opponent choices), then pick the defender
          whose worst-case is highest. This is the most robust pure strategy.
        </p>
      </div>

      {/* Backward Induction */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-gray-900">Backward Induction</h3>
        <p className="text-sm text-gray-600">
          The recursive structure evaluates the game tree from leaves to root:
        </p>
        <div className="bg-gray-100 rounded p-2 font-mono text-xs text-gray-800 space-y-1">
          <div>Round 3 (1v1): base case, direct lookup</div>
          <div>Round 2 (3v3): solve 3x3 payoff matrix</div>
          <div className="ml-4">&rarr; each cell recurses to Round 3</div>
          <div>Round 1 (5v5): solve 5x5 payoff matrix</div>
          <div className="ml-4">&rarr; each cell recurses to Round 2</div>
        </div>
      </div>

      {/* Complexity */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-gray-900">Computational Complexity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                <th className="px-2 py-1.5 text-left">Round</th>
                <th className="px-2 py-1.5 text-left">Defenders</th>
                <th className="px-2 py-1.5 text-left">Attacker pairs</th>
                <th className="px-2 py-1.5 text-left">Recurse to</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr>
                <td className="px-2 py-1.5">1 (5v5)</td>
                <td className="px-2 py-1.5">5 x 5 = 25</td>
                <td className="px-2 py-1.5">C(4,2) = 6</td>
                <td className="px-2 py-1.5">Round 2</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5">2 (3v3)</td>
                <td className="px-2 py-1.5">3 x 3 = 9</td>
                <td className="px-2 py-1.5">C(2,2) = 1</td>
                <td className="px-2 py-1.5">Round 3</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5">3 (1v1)</td>
                <td className="px-2 py-1.5">1</td>
                <td className="px-2 py-1.5">&mdash;</td>
                <td className="px-2 py-1.5">Base case</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-600">
          Total: approximately 1,350 operations &mdash; executes in under a millisecond on any
          device.
        </p>
      </div>
    </div>
  );
}

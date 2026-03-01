import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/Common/Card';
import { AdvancedMathSection } from '@/components/Display/AdvancedMathSection';

export function MethodologyPage() {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Layout title="Methodology" showBack onBack={() => navigate('/')}>
      <div className="flex flex-col gap-4 p-4">
        {/* Intro */}
        <p className="text-sm text-gray-600">
          The app uses game theory to recommend optimal defenders and attackers at each step of the
          pairing process. It evaluates every possible future across all rounds to find the best
          move now. Here&rsquo;s how it works.
        </p>

        {/* Section 1: Scoring */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Scoring: The 0&ndash;20 Scale
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Every game is scored on a <strong className="text-gray-900">0&ndash;20 scale</strong>.
              The key property is that it&rsquo;s{' '}
              <strong className="text-gray-900">zero-sum</strong>: if you score 14, your opponent
              scores 6. It always adds up to 20 &mdash; like splitting a pie.
            </p>
            <p>
              A score of 10 is a draw. Above 10 is a win for you, below 10 is a loss. This zero-sum
              property is what makes game theory applicable &mdash; what&rsquo;s good for you is
              equally bad for your opponent.
            </p>
          </div>
        </Card>

        {/* Section 2: Defender Score */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Building Block: Defender Score
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              When you nominate a defender, your opponent will send their{' '}
              <strong className="text-gray-900">two best counters</strong> &mdash; the two players
              your defender scores worst against. Your defender then picks the better of those two
              to face.
            </p>
            <p>
              This means your guaranteed score as defender is the{' '}
              <strong className="text-gray-900">second-lowest</strong> value in that player&rsquo;s
              matchup row. We call this the{' '}
              <strong className="text-gray-900">Defender Score</strong>.
            </p>

            {/* Example table */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Example: Your player&rsquo;s scores vs 5 opponents
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      <th className="px-2 py-1.5 text-left">vs Opp A</th>
                      <th className="px-2 py-1.5 text-left">vs Opp B</th>
                      <th className="px-2 py-1.5 text-left">vs Opp C</th>
                      <th className="px-2 py-1.5 text-left">vs Opp D</th>
                      <th className="px-2 py-1.5 text-left">vs Opp E</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-gray-900">
                      <td className="px-2 py-1.5 bg-red-50 text-red-700 font-medium">6</td>
                      <td className="px-2 py-1.5 bg-blue-50 text-blue-700 font-semibold">8</td>
                      <td className="px-2 py-1.5">10</td>
                      <td className="px-2 py-1.5">12</td>
                      <td className="px-2 py-1.5">15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Opponent sends the 6 and the 8 (your two worst). You choose the{' '}
                <span className="font-semibold text-blue-700">8</span>. That&rsquo;s your Defender
                Score.
              </p>
            </div>

            <p className="text-xs text-gray-500 italic">
              This is a useful shorthand, but it only considers the current round. The full
              algorithm goes further &mdash; read on.
            </p>
          </div>
        </Card>

        {/* Section 3: Attacker Pairs */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Building Block: Attacker Pairs
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              When you send two attackers against the opponent&rsquo;s defender, their defender{' '}
              <strong className="text-gray-900">picks the worse matchup for you</strong>. So your
              expected score from that pairing is the{' '}
              <strong className="text-gray-900">lower</strong> of the two attackers&rsquo; scores.
            </p>
            <p>
              You want to send a pair where even the worse option is still decent. In game theory
              this is called a <strong className="text-gray-900">maximin</strong> strategy &mdash;
              maximise your minimum outcome.
            </p>

            {/* Example table */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Example: Three possible attacker pairs vs opponent&rsquo;s defender
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      <th className="px-2 py-1.5 text-left">Pair</th>
                      <th className="px-2 py-1.5 text-left">Attacker 1</th>
                      <th className="px-2 py-1.5 text-left">Attacker 2</th>
                      <th className="px-2 py-1.5 text-left">Expected</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-1.5 text-gray-900">A + B</td>
                      <td className="px-2 py-1.5">14</td>
                      <td className="px-2 py-1.5">9</td>
                      <td className="px-2 py-1.5">9</td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="px-2 py-1.5 text-gray-900 font-medium">A + C</td>
                      <td className="px-2 py-1.5">14</td>
                      <td className="px-2 py-1.5">12</td>
                      <td className="px-2 py-1.5 text-blue-700 font-semibold">12</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 text-gray-900">B + C</td>
                      <td className="px-2 py-1.5">9</td>
                      <td className="px-2 py-1.5">12</td>
                      <td className="px-2 py-1.5">9</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                A + C is the best pair &mdash; even though A scores higher alone, the opponent will
                dodge A and face whoever scores lower. With A + C, the floor is{' '}
                <span className="font-semibold text-blue-700">12</span>.
              </p>
            </div>

            <p className="text-xs text-gray-500 italic">
              Again, this only considers one round. The app goes deeper.
            </p>
          </div>
        </Card>

        {/* Section 4: The Full Algorithm */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            The Full Algorithm: Thinking Ahead
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              The defender score and attacker maximin are useful intuitions, but they only look at{' '}
              <strong className="text-gray-900">the current round</strong>. The app goes much
              further &mdash; it considers{' '}
              <strong className="text-gray-900">all rounds together</strong>.
            </p>
            <p>
              Think of it like chess: you don&rsquo;t just look at the next move, you think several
              moves ahead. The app does this automatically using a technique called{' '}
              <strong className="text-gray-900">backward induction</strong>.
            </p>

            {/* How it works */}
            <div className="rounded-md bg-gray-50 border border-gray-200 p-3 space-y-2">
              <p className="font-medium text-gray-900 text-xs uppercase tracking-wide">
                How it works
              </p>
              <p>The app starts from the end and works backwards:</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                <li>
                  <strong className="text-gray-900">Final round</strong> is trivial &mdash; the
                  remaining matchups are forced.
                </li>
                <li>
                  <strong className="text-gray-900">Earlier rounds</strong>: for every possible
                  situation, find the best defender knowing how all subsequent rounds will play out.
                </li>
                <li>
                  <strong className="text-gray-900">Round 1</strong>: find the best defender knowing
                  the full consequences for every round that follows.
                </li>
              </ol>
              <p className="text-xs text-gray-500 mt-1.5">
                For 5-player teams (UKTC) this is 3 rounds. For 8-player teams (WTC) it&rsquo;s 4
                rounds, with the final round resolving 4 pairings at once via auto-pairing of
                refused and uninvolved players.
              </p>
            </div>

            <p>
              This means every recommendation accounts for the{' '}
              <strong className="text-gray-900">
                total expected score across all remaining pairings
              </strong>
              , not just this round.
            </p>

            {/* Why it matters */}
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 space-y-1.5">
              <p className="font-medium text-amber-900 text-xs uppercase tracking-wide">
                Why this matters
              </p>
              <p className="text-amber-800">
                Sometimes the player with the best Defender Score isn&rsquo;t the best choice.
                Defending with Player A might guarantee 10 points this round but leave you with
                terrible options for Rounds 2 and 3. Defending with Player B might only guarantee 9
                this round, but unlock 5 extra points across the remaining rounds &mdash; giving a
                better total outcome.
              </p>
            </div>

            <p>
              The app also considers that{' '}
              <strong className="text-gray-900">both teams choose defenders simultaneously</strong>.
              It builds a matrix of every possible combination (your defender vs their defender) and
              finds the strategy where neither team can improve by switching &mdash; a{' '}
              <strong className="text-gray-900">Nash equilibrium</strong>.
            </p>
          </div>
        </Card>

        {/* Section 5: What the Numbers Mean */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">What the Numbers Mean</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>When the app shows you recommendations, you&rsquo;ll see two key numbers:</p>
            <dl className="space-y-3">
              <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                <dt className="font-medium text-gray-900">EV (Expected Value)</dt>
                <dd className="mt-1">
                  The total expected score across{' '}
                  <strong className="text-gray-900">all remaining pairings</strong> if you make this
                  choice and both teams play optimally from here. This is the number from the full
                  backward induction algorithm &mdash; the one you should rely on.
                </dd>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                <dt className="font-medium text-gray-900">Defender Score</dt>
                <dd className="mt-1">
                  The simpler one-round metric (second-lowest matchup value). Shown for reference
                  and intuition, but{' '}
                  <strong className="text-gray-900">EV is what drives the recommendation</strong>.
                </dd>
              </div>
            </dl>
            <p>
              The recommended choice is always the one with the highest total expected value,
              accounting for all downstream consequences.
            </p>
          </div>
        </Card>

        {/* Section 6: Advanced (Collapsible) */}
        <Card>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between min-h-[44px]"
            aria-expanded={showAdvanced}
          >
            <h2 className="text-base font-semibold text-gray-900">Advanced: The Mathematics</h2>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showAdvanced && <AdvancedMathSection />}
        </Card>
      </div>
    </Layout>
  );
}

import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';

export function PairingsExplainedPage() {
  const navigate = useNavigate();

  return (
    <Layout title="UKTC Pairings" showBack onBack={() => navigate('/')}>
      <div className="flex flex-col gap-6 p-4 pb-8">
        <p className="text-sm text-gray-600">
          At a UKTC team tournament, each team has 5 players. Before the games start, both captains
          go through a pairing process to decide who plays who. You end up with 5 matchups, and the
          process takes 3 rounds.
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-700">5 vs 5</span>
          <span>&rarr;</span>
          <span className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-700">3 vs 3</span>
          <span>&rarr;</span>
          <span className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-700">1 vs 1</span>
        </div>

        {/* Scoring */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Scoring</h2>
          <p className="text-sm text-gray-600">
            Each game is scored on a 0&ndash;20 scale, and it&rsquo;s zero-sum &mdash; if you score
            14, your opponent scores 6. A 10-10 is a draw.
          </p>
        </section>

        {/* Round 1 */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Round 1 &mdash; 5 vs 5</h2>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <p>
              Both captains secretly pick one of their players as a{' '}
              <strong className="text-gray-900">defender</strong>. Both choices are revealed at the
              same time.
            </p>
            <p>
              Next, each captain picks 2 of their remaining 4 players to send as{' '}
              <strong className="text-gray-900">attackers</strong> against the other team&rsquo;s
              defender.
            </p>
            <p>
              Each defender then looks at the 2 attackers coming their way and{' '}
              <strong className="text-gray-900">chooses which one to face</strong>. The attacker
              they didn&rsquo;t pick goes back to the pool.
            </p>
            <p className="text-gray-500 italic">
              That locks in 2 pairings, leaving 3 players per side.
            </p>
          </div>
        </section>

        {/* Round 2 */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Round 2 &mdash; 3 vs 3</h2>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <p>
              Same idea again. Both captains pick a defender from the remaining 3 players, revealed
              simultaneously.
            </p>
            <p>
              This time the attacker phase is automatic &mdash; there are only 2 players left on
              each side, so they both get sent. No choice to make.
            </p>
            <p>Defenders still choose which attacker to face, same as Round 1.</p>
            <p className="text-gray-500 italic">
              That locks in 2 more pairings, leaving 1 player per side.
            </p>
          </div>
        </section>

        {/* Round 3 */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Round 3 &mdash; 1 vs 1</h2>
          <p className="text-sm text-gray-600">
            The last player from each team faces each other. No decisions left &mdash; this matchup
            is whatever fell out of the earlier rounds. That&rsquo;s all 5 pairings done.
          </p>
        </section>
      </div>
    </Layout>
  );
}

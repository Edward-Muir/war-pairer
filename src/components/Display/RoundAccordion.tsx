import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/Common/Card';
import { MatchupPreview } from './MatchupPreview';
import { ScoreBadge } from './ScoreBadge';
import { calculateRoundTotals } from '@/utils/scoring';
import type { TournamentRound } from '@/store/types';

export interface RoundAccordionProps {
  round: TournamentRound;
  roundIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

export function RoundAccordion({
  round,
  roundIndex,
  isExpanded,
  onToggle,
  className = '',
}: RoundAccordionProps) {
  const { expectedTotal, actualTotal } = calculateRoundTotals(round.pairings);
  const isCompleted = round.status === 'completed' && round.pairings.length > 0;

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {roundIndex + 1}
            </span>
            <span className="font-semibold text-gray-900 truncate">
              {round.opponentTeamName || `Round ${roundIndex + 1}`}
            </span>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-3 mt-1 ml-8">
              <span className="text-xs text-gray-500">
                Expected: <span className="font-medium">{expectedTotal}</span>
              </span>
              {actualTotal !== null && (
                <span className="text-xs text-gray-500">
                  Actual: <span className="font-medium">{actualTotal}</span>
                </span>
              )}
            </div>
          )}
          {!isCompleted && (
            <p className="text-xs text-gray-400 mt-1 ml-8">
              {round.status === 'in_progress' ? 'In progress' : 'Not started'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCompleted && <ScoreBadge score={expectedTotal} size="sm" />}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && isCompleted && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="space-y-2 pt-3">
            {round.pairings.map((pairing, index) => (
              <MatchupPreview
                key={index}
                ourPlayer={pairing.ourPlayer}
                oppPlayer={pairing.oppPlayer}
                expectedScore={pairing.expectedScore}
                actualScore={pairing.actualScore}
                round={pairing.round}
                compact
              />
            ))}
          </div>

          {/* Round totals summary */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Round Total</span>
            <div className="flex items-center gap-2">
              <ScoreBadge score={expectedTotal} size="sm" />
              {actualTotal !== null && (
                <>
                  <span className="text-gray-400">→</span>
                  <ScoreBadge score={actualTotal} size="sm" />
                  <span
                    className={`text-xs font-medium ${
                      actualTotal >= expectedTotal
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ({actualTotal >= expectedTotal ? '+' : ''}
                    {actualTotal - expectedTotal})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expanded but no pairings */}
      {isExpanded && !isCompleted && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-sm text-gray-400 pt-3 text-center">
            Pairings not yet completed
          </p>
        </div>
      )}
    </Card>
  );
}

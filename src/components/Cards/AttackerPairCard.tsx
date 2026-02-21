import { Card } from '@/components/Common/Card'
import type { Player } from '@/store/types'
import type { AttackerPairAnalysis } from '@/algorithms/attackerAnalysis'
import type { FullAttackerAnalysis } from '@/algorithms/fullGameTheory'
import {
  scoreToBackgroundColor,
  scoreToTextColor,
  formatScoreWithDelta,
} from '@/utils/scoring'

export interface AttackerPairCardProps {
  analysis: AttackerPairAnalysis | FullAttackerAnalysis
  ourPlayers: Player[]
  oppDefender: Player
  rank: number
  isRecommended?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

/** Type guard to check if analysis has full game theory data */
function isFullAnalysis(
  analysis: AttackerPairAnalysis | FullAttackerAnalysis
): analysis is FullAttackerAnalysis {
  return 'totalExpectedValue' in analysis
}

export function AttackerPairCard({
  analysis,
  ourPlayers,
  oppDefender,
  rank,
  isRecommended,
  selected = false,
  disabled = false,
  onClick,
  className = '',
}: AttackerPairCardProps) {
  const showRecommended = isRecommended ?? rank === 1
  const disabledStyles = disabled ? 'opacity-50 pointer-events-none' : ''

  // Resolve attacker indices to players
  const attacker1 = ourPlayers.find((p) => p.index === analysis.attackers[0])
  const attacker2 = ourPlayers.find((p) => p.index === analysis.attackers[1])

  if (!attacker1 || !attacker2) {
    return null
  }

  return (
    <Card
      onClick={disabled ? undefined : onClick}
      selected={selected}
      className={`${disabledStyles} ${className}`}
    >
      <div className="space-y-3">
        {/* Rank and Recommended Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">#{rank}</span>
          {showRecommended && (
            <span className="inline-flex items-center rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
              Recommended
            </span>
          )}
        </div>

        {/* Two Attackers Side by Side */}
        <div className="flex gap-2">
          {[attacker1, attacker2].map((attacker) => {
            const isForced = attacker.index === analysis.forcedMatchup
            return (
              <div
                key={attacker.id}
                className={`flex flex-1 flex-col items-center rounded-lg p-2 text-center ${
                  isForced ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-600 shadow-sm">
                  {attacker.index + 1}
                </div>
                <div className="mt-1 w-full truncate text-sm font-semibold text-gray-900">
                  {attacker.name}
                </div>
                <div className="w-full truncate text-xs text-gray-500">
                  {attacker.faction}
                </div>
                {isForced && (
                  <div className="mt-1 text-xs font-medium text-blue-600">
                    Will play
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Expected Scores and Opponent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFullAnalysis(analysis) ? (
              <>
                {/* Total expected value (full tree) - prominent */}
                <span className="text-sm text-gray-600">Total:</span>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-sm font-bold ${scoreToBackgroundColor(analysis.totalExpectedValue)} ${scoreToTextColor(analysis.totalExpectedValue)}`}
                  title="Total expected value including future rounds"
                >
                  {analysis.totalExpectedValue.toFixed(1)}
                </span>
                {/* Immediate score - secondary */}
                <span className="text-xs text-gray-400">
                  (this: {formatScoreWithDelta(analysis.expectedScore)})
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600">Expected:</span>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-sm font-bold ${scoreToBackgroundColor(analysis.expectedScore)} ${scoreToTextColor(analysis.expectedScore)}`}
                >
                  {formatScoreWithDelta(analysis.expectedScore)}
                </span>
              </>
            )}
          </div>
          <span className="truncate text-sm text-gray-500">
            vs {oppDefender.faction}
          </span>
        </div>
      </div>
    </Card>
  )
}

import { Card } from '@/components/Common/Card'
import type { Player } from '@/store/types'
import type { DefenderAnalysis } from '@/algorithms/defenderScore'
import type { FullDefenderAnalysis } from '@/algorithms/fullGameTheory'
import { scoreToBackgroundColor, scoreToTextColor } from '@/utils/scoring'

export interface DefenderCardProps {
  player: Player
  analysis: DefenderAnalysis | FullDefenderAnalysis
  opponentPlayers: Player[]
  rank: number
  isRecommended?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

/** Type guard to check if analysis has full game theory data */
function isFullAnalysis(
  analysis: DefenderAnalysis | FullDefenderAnalysis
): analysis is FullDefenderAnalysis {
  return 'gameValue' in analysis
}

export function DefenderCard({
  player,
  analysis,
  opponentPlayers,
  rank,
  isRecommended,
  selected = false,
  disabled = false,
  onClick,
  className = '',
}: DefenderCardProps) {
  const showRecommended = isRecommended ?? rank === 1
  const disabledStyles = disabled ? 'opacity-50 pointer-events-none' : ''

  // Resolve worst matchup indices to player names
  const worstMatchupNames = analysis.worstMatchups
    .map((idx) => opponentPlayers.find((p) => p.index === idx))
    .filter((p): p is Player => p !== undefined)
    .map((p) => p.faction)

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

        {/* Player Info with Scores */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
            {player.index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-gray-900">
              {player.name}
            </div>
            <div className="truncate text-sm text-gray-600">
              {player.faction}
            </div>
          </div>
          {/* Score badges */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            {/* Game Value (full tree) - shown prominently if available */}
            {isFullAnalysis(analysis) && (
              <div
                className={`flex h-10 min-w-[56px] items-center justify-center rounded-lg px-2 text-lg font-bold ${scoreToBackgroundColor(analysis.gameValue)} ${scoreToTextColor(analysis.gameValue)}`}
                title="Total expected value from full game analysis"
              >
                {analysis.gameValue.toFixed(1)}
              </div>
            )}
            {/* Defender Score (simple metric) */}
            <div
              className={`flex items-center justify-center rounded px-2 py-0.5 text-sm font-medium ${
                isFullAnalysis(analysis)
                  ? 'bg-gray-100 text-gray-600'
                  : `${scoreToBackgroundColor(analysis.defenderScore)} ${scoreToTextColor(analysis.defenderScore)} h-10 min-w-[48px] text-lg font-bold rounded-lg`
              }`}
              title="Defender score (guaranteed minimum)"
            >
              {isFullAnalysis(analysis) ? `Def: ${analysis.defenderScore}` : analysis.defenderScore}
            </div>
          </div>
        </div>

        {/* Worst Matchups */}
        <div className="truncate text-sm text-gray-500">
          <span className="font-medium">Worst matchups:</span>{' '}
          {worstMatchupNames.length > 0
            ? worstMatchupNames.join(', ')
            : 'None identified'}
        </div>
      </div>
    </Card>
  )
}

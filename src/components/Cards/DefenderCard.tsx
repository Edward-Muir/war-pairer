import { Card } from '@/components/Common/Card'
import type { Player } from '@/store/types'
import type { DefenderAnalysis } from '@/algorithms/defenderScore'
import { scoreToBackgroundColor, scoreToTextColor } from '@/utils/scoring'

export interface DefenderCardProps {
  player: Player
  analysis: DefenderAnalysis
  opponentPlayers: Player[]
  rank: number
  isRecommended?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
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
    .map((p) => p.name)

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

        {/* Player Info with Defender Score */}
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
          <div
            className={`flex h-10 min-w-[48px] shrink-0 items-center justify-center rounded-lg px-2 text-lg font-bold ${scoreToBackgroundColor(analysis.defenderScore)} ${scoreToTextColor(analysis.defenderScore)}`}
          >
            {analysis.defenderScore}
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

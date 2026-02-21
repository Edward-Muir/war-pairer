import { Card } from '@/components/Common/Card'
import type { Player } from '@/store/types'
import { scoreToBackgroundColor, scoreToTextColor } from '@/utils/scoring'

export interface PlayerCardProps {
  player: Player
  score?: number
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  showIndex?: boolean
  isOpponent?: boolean
}

export function PlayerCard({
  player,
  score,
  selected = false,
  disabled = false,
  onClick,
  className = '',
  showIndex = true,
  isOpponent = false,
}: PlayerCardProps) {
  const disabledStyles = disabled ? 'opacity-50 pointer-events-none' : ''

  return (
    <Card
      onClick={disabled ? undefined : onClick}
      selected={selected}
      className={`min-h-[60px] ${disabledStyles} ${className}`}
    >
      <div className="flex items-center gap-3">
        {showIndex && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
            {player.index + 1}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-gray-900">
            {isOpponent ? player.faction : player.name}
          </div>
          {!isOpponent && (
            <div className="truncate text-sm text-gray-600">{player.faction}</div>
          )}
        </div>
        {score !== undefined && (
          <div
            className={`flex h-10 min-w-[40px] shrink-0 items-center justify-center rounded-lg px-2 text-lg font-bold ${scoreToBackgroundColor(score)} ${scoreToTextColor(score)}`}
          >
            {score}
          </div>
        )}
      </div>
    </Card>
  )
}

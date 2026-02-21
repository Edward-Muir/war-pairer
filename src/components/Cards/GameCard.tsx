import { Trash2 } from 'lucide-react'
import { Card } from '@/components/Common/Card'
import type { Game } from '@/store/types'

export interface GameCardProps {
  game: Game
  onDelete?: () => void
  onClick?: () => void
  className?: string
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function GameCard({
  game,
  onDelete,
  onClick,
  className = '',
}: GameCardProps) {
  const isCompleted = game.status === 'completed';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <Card onClick={onClick} className={className}>
      <div className="space-y-2">
        {/* Header Row: Title and Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {game.ourTeam.teamName} vs {game.opponentTeamName}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isCompleted ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                In Progress
              </span>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Delete game"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Date */}
        <p className="text-sm text-gray-500">
          {formatDate(game.createdAt)}
        </p>
      </div>
    </Card>
  )
}

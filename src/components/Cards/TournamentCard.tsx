import { Trash2 } from 'lucide-react'
import { Card } from '@/components/Common/Card'
import { Button } from '@/components/Common/Button'
import type { Tournament } from '@/store/types'

export interface TournamentCardProps {
  tournament: Tournament
  onContinue?: () => void
  onDelete?: () => void
  onClick?: () => void
  className?: string
}

export function TournamentCard({
  tournament,
  onContinue,
  onDelete,
  onClick,
  className = '',
}: TournamentCardProps) {
  // Determine tournament status
  const isCompleted =
    tournament.rounds.length > 0 &&
    tournament.rounds.every((r) => r.status === 'completed')

  const currentRound = tournament.currentRoundIndex + 1
  const totalRounds = tournament.rounds.length

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  const handleContinue = () => {
    onContinue?.()
  }

  return (
    <Card onClick={onClick} className={className}>
      <div className="space-y-3">
        {/* Header Row: Tournament Name and Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {tournament.name}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isCompleted ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                Active
              </span>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Delete tournament"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Team Name */}
        <div className="text-sm text-gray-600">
          Using: {tournament.ourTeam.teamName}
        </div>

        {/* Round Indicator */}
        <div className="text-sm text-gray-500">
          {isCompleted ? (
            `${totalRounds} rounds completed`
          ) : totalRounds > 0 ? (
            `Round ${currentRound} of ${totalRounds}`
          ) : (
            'No rounds started'
          )}
        </div>

        {/* Continue Button */}
        {!isCompleted && onContinue && (
          <Button variant="primary" fullWidth onClick={handleContinue}>
            Continue
          </Button>
        )}
      </div>
    </Card>
  )
}

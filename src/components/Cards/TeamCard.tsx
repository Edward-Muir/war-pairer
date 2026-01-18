import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/Common/Card'
import type { Team } from '@/store/types'

export interface TeamCardProps {
  team: Team
  onEdit?: () => void
  onDelete?: () => void
  onClick?: () => void
  selected?: boolean
  className?: string
}

export function TeamCard({
  team,
  onEdit,
  onDelete,
  onClick,
  selected = false,
  className = '',
}: TeamCardProps) {
  // Get unique factions for preview
  const uniqueFactions = [...new Set(team.players.map((p) => p.faction))].filter(
    (f) => f.trim() !== ''
  )
  const factionPreview =
    uniqueFactions.length > 0 ? uniqueFactions.join(', ') : 'No factions set'

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <Card onClick={onClick} selected={selected} className={className}>
      <div className="space-y-1">
        {/* Header Row: Team Name and Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {team.teamName}
            </h3>
          </div>
          <div className="flex shrink-0 gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Edit team"
              >
                <Pencil className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Delete team"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Player Count */}
        <div className="text-sm text-gray-600">
          {team.players.length} players
        </div>

        {/* Faction Preview */}
        <div className="truncate text-sm text-gray-500">{factionPreview}</div>
      </div>
    </Card>
  )
}

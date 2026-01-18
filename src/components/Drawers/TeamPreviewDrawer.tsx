import type { Team } from '@/store/types';
import { BottomSheet } from '@/components/Common/BottomSheet';
import { PlayerCard } from '@/components/Cards/PlayerCard';

export interface TeamPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  title?: string;
}

export function TeamPreviewDrawer({
  isOpen,
  onClose,
  team,
  title,
}: TeamPreviewDrawerProps) {
  const displayTitle = title ?? team?.teamName ?? 'Team Preview';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={displayTitle}>
      {!team ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-gray-500">No team selected</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {team.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              showIndex
            />
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

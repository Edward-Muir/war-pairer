import { BottomSheet } from '@/components/Common/BottomSheet';
import { ScoreInput } from '@/components/Inputs/ScoreInput';
import { Button } from '@/components/Common/Button';
import type { Player } from '@/store/types';

export interface MatrixRowEditorProps {
  isOpen: boolean;
  onClose: () => void;
  ourPlayer: Player;
  ourIndex: number;
  oppTeam: Player[];
  scores: number[];
  onScoreChange: (oppIndex: number, score: number) => void;
}

/**
 * Mobile-friendly bottom sheet for editing all matchups for a single player.
 * Shows larger inputs than the grid view for easier touch interaction.
 */
export function MatrixRowEditor({
  isOpen,
  onClose,
  ourPlayer,
  oppTeam,
  scores,
  onScoreChange,
}: MatrixRowEditorProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`${ourPlayer.name}'s Matchups`}
    >
      <div className="space-y-4">
        {/* Description */}
        <p className="text-sm text-gray-500">
          Set expected scores for {ourPlayer.name} ({ourPlayer.faction}) against each opponent.
        </p>

        {/* Opponent matchup list */}
        <div className="space-y-3">
          {oppTeam.map((opponent, oppIndex) => (
            <div
              key={opponent.id}
              className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg"
            >
              {/* Opponent info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {opponent.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {opponent.faction}
                </div>
              </div>

              {/* Score input - larger size for touch */}
              <ScoreInput
                value={scores[oppIndex] ?? 10}
                onChange={(score) => onScoreChange(oppIndex, score)}
                size="lg"
                showColorCoding={true}
                enableModal={true}
                aria-label={`Score for ${ourPlayer.name} vs ${opponent.name}`}
              />
            </div>
          ))}
        </div>

        {/* Done button */}
        <div className="pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

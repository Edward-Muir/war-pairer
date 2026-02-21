import { useState } from 'react';
import { BottomSheet } from '@/components/Common/BottomSheet';
import { ScorePickerCell } from '@/components/Inputs/ScorePickerCell';
import { ScorePickerPopover } from '@/components/Inputs/ScorePickerPopover';
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
  const [activeCell, setActiveCell] = useState<{ oppIndex: number } | null>(null);

  const handleScoreSelect = (score: number) => {
    if (activeCell) {
      onScoreChange(activeCell.oppIndex, score);
      setActiveCell(null);
    }
  };

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
                  {opponent.faction}
                </div>
              </div>

              {/* Score picker cell - tap to open popover */}
              <ScorePickerCell
                value={scores[oppIndex] ?? 10}
                onTap={() => setActiveCell({ oppIndex })}
                aria-label={`Score for ${ourPlayer.name} vs ${opponent.faction}`}
                className="w-14 h-14 text-xl"
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

      {/* Score picker popover - shared across all cells */}
      <ScorePickerPopover
        isOpen={activeCell !== null}
        value={activeCell ? scores[activeCell.oppIndex] ?? 10 : 10}
        ourFaction={ourPlayer.faction}
        oppFaction={activeCell ? oppTeam[activeCell.oppIndex]?.faction : undefined}
        onSelect={handleScoreSelect}
        onClose={() => setActiveCell(null)}
      />
    </BottomSheet>
  );
}

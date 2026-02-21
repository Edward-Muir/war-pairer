import { useState } from 'react';
import { ScorePickerCell } from '@/components/Inputs/ScorePickerCell';
import { ScorePickerPopover } from '@/components/Inputs/ScorePickerPopover';
import { MatrixRowEditor } from './MatrixRowEditor';
import type { Player } from '@/store/types';

export interface MatrixGridProps {
  ourTeam: Player[];
  oppTeam: Player[];
  scores: number[][];
  onScoreChange: (ourIndex: number, oppIndex: number, score: number) => void;
  disabled?: boolean;
  className?: string;
}

interface ActiveCell {
  ourIndex: number;
  oppIndex: number;
}

/**
 * 5x5 matchup matrix grid with sticky headers for mobile scrolling.
 * Each cell displays the expected score for our player (row) vs opponent (column).
 * Tap a cell to open a compact score picker popover.
 */
export function MatrixGrid({
  ourTeam,
  oppTeam,
  scores,
  onScoreChange,
  disabled = false,
  className = '',
}: MatrixGridProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);

  const handleRowEdit = (ourIndex: number) => {
    setEditingRow(ourIndex);
  };

  const handleRowEditClose = () => {
    setEditingRow(null);
  };

  const handleRowScoreChange = (oppIndex: number, score: number) => {
    if (editingRow !== null) {
      onScoreChange(editingRow, oppIndex, score);
    }
  };

  const handleCellTap = (ourIndex: number, oppIndex: number) => {
    if (disabled) return;
    setActiveCell({ ourIndex, oppIndex });
  };

  const handleCellSelect = (score: number) => {
    if (activeCell) {
      onScoreChange(activeCell.ourIndex, activeCell.oppIndex, score);
      setActiveCell(null);
    }
  };

  const handlePopoverClose = () => {
    setActiveCell(null);
  };

  return (
    <>
      <div className={`overflow-x-auto ${className}`}>
        <table className="border-separate border-spacing-0 min-w-max">
          <thead>
            <tr>
              {/* Corner cell */}
              <th
                className="sticky top-0 left-0 z-30 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-500 border-b border-r border-gray-200 h-[100px] align-bottom"
              >
                <span className="block pb-1">vs</span>
              </th>
              {/* Opponent column headers (rotated 90 degrees, faction highlighted) */}
              {oppTeam.map((player) => (
                <th
                  key={player.id}
                  className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 h-[100px] w-[52px] p-0 align-bottom"
                  title={player.faction}
                >
                  <div className="h-full flex items-end justify-center pb-1">
                    <div
                      className="flex flex-col items-start"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      <span className="text-xs font-semibold text-gray-700">{player.faction}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ourTeam.map((ourPlayer, ourIndex) => (
              <tr key={ourPlayer.id}>
                {/* Row header - our player name (clickable to edit row) */}
                <td className="sticky left-0 z-10 bg-gray-50 px-1 py-1 border-r border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleRowEdit(ourIndex)}
                    disabled={disabled}
                    className="flex items-center min-h-[44px] min-w-[44px] text-left hover:bg-gray-200 rounded px-1 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={`Edit row for ${ourPlayer.name}`}
                  >
                    <div>
                      <div className="text-xs font-medium text-gray-700 truncate max-w-[70px]">
                        {ourPlayer.name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[70px]">
                        {ourPlayer.faction}
                      </div>
                    </div>
                  </button>
                </td>
                {/* Score cells */}
                {oppTeam.map((oppPlayer, oppIndex) => (
                  <td
                    key={oppPlayer.id}
                    className="p-1 border-b border-gray-100"
                  >
                    <ScorePickerCell
                      value={scores[ourIndex]?.[oppIndex] ?? 10}
                      onTap={() => handleCellTap(ourIndex, oppIndex)}
                      disabled={disabled}
                      showColorCoding={true}
                      aria-label={`${ourPlayer.name} vs ${oppPlayer.faction}: ${scores[ourIndex]?.[oppIndex] ?? 10}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shared score picker popover */}
      <ScorePickerPopover
        isOpen={activeCell !== null}
        value={activeCell ? scores[activeCell.ourIndex]?.[activeCell.oppIndex] ?? 10 : 10}
        ourFaction={activeCell ? ourTeam[activeCell.ourIndex]?.faction : undefined}
        oppFaction={activeCell ? oppTeam[activeCell.oppIndex]?.faction : undefined}
        onSelect={handleCellSelect}
        onClose={handlePopoverClose}
      />

      {/* Row editor bottom sheet */}
      {editingRow !== null && (
        <MatrixRowEditor
          isOpen={true}
          onClose={handleRowEditClose}
          ourPlayer={ourTeam[editingRow]}
          ourIndex={editingRow}
          oppTeam={oppTeam}
          scores={scores[editingRow] ?? [10, 10, 10, 10, 10]}
          onScoreChange={handleRowScoreChange}
        />
      )}
    </>
  );
}

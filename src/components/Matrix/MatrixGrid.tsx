import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { MatrixCell } from './MatrixCell';
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

/**
 * 5x5 matchup matrix grid with sticky headers for mobile scrolling.
 * Each cell displays the expected score for our player (row) vs opponent (column).
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

  return (
    <>
      <div className={`overflow-x-auto -mx-4 px-4 ${className}`}>
        <table className="border-separate border-spacing-0 min-w-max">
          <thead>
            <tr>
              {/* Corner cell */}
              <th
                className="sticky top-0 left-0 z-30 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 border-b border-r border-gray-200"
              >
                vs
              </th>
              {/* Opponent column headers */}
              {oppTeam.map((player) => (
                <th
                  key={player.id}
                  className="sticky top-0 z-20 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-700 border-b border-gray-200 min-w-[100px]"
                  title={player.faction}
                >
                  <div className="truncate max-w-[80px]">{player.name}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[80px]">
                    {player.faction}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ourTeam.map((ourPlayer, ourIndex) => (
              <tr key={ourPlayer.id}>
                {/* Row header - our player name */}
                <td
                  className="sticky left-0 z-10 bg-gray-50 px-2 py-2 border-r border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-[80px]">
                      <div className="text-xs font-medium text-gray-700 truncate max-w-[70px]">
                        {ourPlayer.name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[70px]">
                        {ourPlayer.faction}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRowEdit(ourIndex)}
                      disabled={disabled}
                      className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      aria-label={`Edit row for ${ourPlayer.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                {/* Score cells */}
                {oppTeam.map((oppPlayer, oppIndex) => (
                  <td
                    key={oppPlayer.id}
                    className="p-1 border-b border-gray-100"
                  >
                    <MatrixCell
                      score={scores[ourIndex]?.[oppIndex] ?? 10}
                      onChange={(score) => onScoreChange(ourIndex, oppIndex, score)}
                      ourPlayerName={ourPlayer.name}
                      oppPlayerName={oppPlayer.name}
                      disabled={disabled}
                      size="sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

import type { Player } from '@/store/types';
import { ScoreBadge } from './ScoreBadge';

export interface MatchupPreviewProps {
  ourPlayer: Player;
  oppPlayer: Player;
  expectedScore: number;
  actualScore?: number;
  round: 1 | 2 | 3;
  compact?: boolean;
  className?: string;
}

function RoundBadge({ round }: { round: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-200 text-xs font-medium text-gray-600">
      R{round}
    </span>
  );
}

function PlayerIcon({ index }: { index: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
      {index + 1}
    </span>
  );
}

export function MatchupPreview({
  ourPlayer,
  oppPlayer,
  expectedScore,
  actualScore,
  round,
  compact = false,
  className = '',
}: MatchupPreviewProps) {
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 ${className}`}
      >
        <RoundBadge round={round} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
          {ourPlayer.name}
        </span>
        <span className="text-xs text-gray-400">vs</span>
        <span className="min-w-0 flex-1 truncate text-right text-sm text-gray-600">
          {oppPlayer.name}
        </span>
        <ScoreBadge score={expectedScore} size="sm" />
        {actualScore !== undefined && (
          <span className="text-xs text-gray-500">
            → {actualScore}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${className}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <RoundBadge round={round} />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Pairing Round {round}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Our player */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <PlayerIcon index={ourPlayer.index} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {ourPlayer.name}
            </p>
            <p className="truncate text-xs text-gray-500">{ourPlayer.faction}</p>
          </div>
        </div>

        {/* VS divider */}
        <span className="shrink-0 text-xs font-medium text-gray-400">vs</span>

        {/* Opponent player */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {oppPlayer.name}
            </p>
            <p className="truncate text-xs text-gray-500">{oppPlayer.faction}</p>
          </div>
          <PlayerIcon index={oppPlayer.index} />
        </div>

        {/* Score */}
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <ScoreBadge score={expectedScore} size="md" showDelta />
          {actualScore !== undefined && (
            <span className="text-xs text-gray-500">
              Actual: {actualScore}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

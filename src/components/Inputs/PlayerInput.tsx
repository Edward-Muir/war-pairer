import { FactionAutocomplete } from './FactionAutocomplete';

export interface PlayerInputProps {
  index: number;
  name: string;
  faction: string;
  onNameChange: (name: string) => void;
  onFactionChange: (faction: string) => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  factionError?: string;
  excludedFactions?: string[];
  className?: string;
}

export function PlayerInput({
  index,
  name,
  faction,
  onNameChange,
  onFactionChange,
  label,
  disabled = false,
  error,
  factionError,
  excludedFactions,
  className = '',
}: PlayerInputProps) {
  const displayLabel = label ?? `Player ${index + 1}`;
  const inputId = `player-${index}`;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <input
            type="text"
            id={`${inputId}-name`}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            placeholder={displayLabel}
            aria-label={`${displayLabel} name`}
            className={`
              w-full min-h-[44px] px-3 py-2
              bg-white border border-gray-300 rounded-lg
              text-base text-gray-900
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            `}
          />
        </div>

        <div className="flex-1 min-w-0">
          <FactionAutocomplete
            value={faction}
            onChange={onFactionChange}
            placeholder="Faction"
            id={`${inputId}-faction`}
            disabled={disabled}
            excludedFactions={excludedFactions}
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 ml-10 text-sm text-red-600">{error}</p>
      )}
      {factionError && (
        <p className="mt-1 ml-10 text-sm text-red-600">{factionError}</p>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { BottomSheet } from '@/components/Common/BottomSheet';
import type { Player } from '@/store/types';

export interface PlayerPickerProps {
  players: Player[];
  value: Player | null;
  onChange: (player: Player) => void;
  placeholder?: string;
  label?: string;
  useModal?: boolean;
  disabled?: boolean;
  disabledPlayers?: Player[];
  className?: string;
}

export function PlayerPicker({
  players,
  value,
  onChange,
  placeholder = 'Select a player...',
  label,
  useModal = false,
  disabled = false,
  disabledPlayers = [],
  className = '',
}: PlayerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const disabledPlayerIds = new Set(disabledPlayers.map((p) => p.id));

  // Handle click outside to close dropdown (only for non-modal mode)
  useEffect(() => {
    if (useModal) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [useModal]);

  const handleSelect = (player: Player) => {
    if (disabledPlayerIds.has(player.id)) return;
    onChange(player);
    setIsOpen(false);
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const renderOptions = () => (
    <div className="divide-y divide-gray-100">
      {players.map((player) => {
        const isSelected = value?.id === player.id;
        const isDisabled = disabledPlayerIds.has(player.id);

        return (
          <button
            key={player.id}
            type="button"
            onClick={() => handleSelect(player)}
            disabled={isDisabled}
            className={`
              w-full min-h-[56px] px-4 py-3
              flex items-center justify-between
              text-left
              ${isSelected ? 'bg-blue-50' : 'bg-white'}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 active:bg-gray-100'}
            `}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-900">{player.name}</span>
              <span className="text-sm text-gray-500">{player.faction}</span>
            </div>
            {isSelected && <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          w-full min-h-[44px] px-4 py-2
          flex items-center justify-between
          bg-white border border-gray-300 rounded-lg
          text-left
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        `}
      >
        {value ? (
          <div className="flex flex-col items-start min-w-0">
            <span className="font-medium text-gray-900 truncate">{value.name}</span>
            <span className="text-sm text-gray-500 truncate">{value.faction}</span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDown
          className={`
            w-5 h-5 text-gray-400 flex-shrink-0 ml-2
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* Dropdown mode */}
      {!useModal && isOpen && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 overflow-auto"
        >
          {renderOptions()}
        </div>
      )}

      {/* Modal mode (BottomSheet) */}
      {useModal && (
        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={label || 'Select Player'}
        >
          <div role="listbox">{renderOptions()}</div>
        </BottomSheet>
      )}
    </div>
  );
}

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FactionPickerModal } from './FactionPickerModal';

export interface FactionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  excludedFactions?: string[]; // factions to hide from dropdown (already selected by other players)
}

export function FactionAutocomplete({
  value,
  onChange,
  placeholder = 'Select faction...',
  label,
  id,
  disabled = false,
  className = '',
  excludedFactions = [],
}: FactionAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);

  const inputId =
    id || `faction-${label?.toLowerCase().replace(/\s+/g, '-') || 'input'}`;

  const handleSelect = (faction: string) => {
    onChange(faction);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        id={inputId}
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`
          w-full min-h-[44px] px-4 pr-10 py-2
          bg-white border border-gray-300 rounded-lg
          text-base text-left
          ${value ? 'text-gray-900' : 'text-gray-400'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          relative
        `}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {value || placeholder}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </button>

      <FactionPickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
        excludedFactions={excludedFactions}
      />
    </div>
  );
}

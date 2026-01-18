import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { FACTIONS } from '@/data/factions';

export interface FactionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function FactionAutocomplete({
  value,
  onChange,
  placeholder = 'Select faction...',
  label,
  id,
  disabled = false,
  className = '',
}: FactionAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const inputId = id || `faction-${label?.toLowerCase().replace(/\s+/g, '-') || 'input'}`;
  const listboxId = `${inputId}-listbox`;

  // Filter factions based on input
  const filteredFactions = value.trim()
    ? FACTIONS.filter((faction) =>
        faction.toLowerCase().includes(value.toLowerCase())
      )
    : [...FACTIONS];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const selectFaction = useCallback((faction: string) => {
    onChange(faction);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredFactions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredFactions.length) {
          selectFaction(filteredFactions[highlightedIndex]);
        } else if (filteredFactions.length === 1) {
          selectFaction(filteredFactions[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        if (highlightedIndex >= 0 && highlightedIndex < filteredFactions.length) {
          selectFaction(filteredFactions[highlightedIndex]);
        }
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={inputId}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
          className={`
            w-full min-h-[44px] px-4 pr-10 py-2
            bg-white border border-gray-300 rounded-lg
            text-base text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
        <ChevronDown
          className={`
            absolute right-3 top-1/2 -translate-y-1/2
            w-5 h-5 text-gray-400 pointer-events-none
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </div>

      {isOpen && filteredFactions.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredFactions.map((faction, index) => (
            <li
              key={faction}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={value === faction}
              onClick={() => selectFaction(faction)}
              className={`
                px-4 py-3 min-h-[44px] cursor-pointer
                flex items-center
                ${index === highlightedIndex ? 'bg-blue-50' : ''}
                ${value === faction ? 'bg-blue-100 font-medium' : ''}
                ${index !== highlightedIndex && value !== faction ? 'hover:bg-gray-50' : ''}
                active:bg-gray-100
              `}
            >
              {faction}
            </li>
          ))}
        </ul>
      )}

      {isOpen && filteredFactions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500">
          No factions found
        </div>
      )}
    </div>
  );
}

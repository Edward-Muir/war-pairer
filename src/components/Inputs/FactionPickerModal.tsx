import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAvailableSuperFactions, type SuperFaction } from '@/data/factions';

export interface FactionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (faction: string) => void;
  excludedFactions?: string[];
}

type NavigationLevel = 'super-faction' | 'sub-faction';

export function FactionPickerModal({
  isOpen,
  onClose,
  onSelect,
  excludedFactions = [],
}: FactionPickerModalProps) {
  const [level, setLevel] = useState<NavigationLevel>('super-faction');
  const [selectedSuperFaction, setSelectedSuperFaction] =
    useState<SuperFaction | null>(null);

  // Filter based on excludedFactions
  const excludedSet = useMemo(
    () => new Set(excludedFactions.map((f) => f.toLowerCase())),
    [excludedFactions]
  );

  const availableSuperFactions = useMemo(
    () => getAvailableSuperFactions(excludedFactions),
    [excludedFactions]
  );

  const availableFactions = useMemo(() => {
    if (!selectedSuperFaction) return [];
    return selectedSuperFaction.factions.filter(
      (f) => !excludedSet.has(f.toLowerCase())
    );
  }, [selectedSuperFaction, excludedSet]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLevel('super-faction');
      setSelectedSuperFaction(null);
    }
  }, [isOpen]);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (level === 'sub-faction') {
          setLevel('super-faction');
          setSelectedSuperFaction(null);
        } else {
          onClose();
        }
      }
    },
    [level, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  const handleSuperFactionSelect = (sf: SuperFaction) => {
    setSelectedSuperFaction(sf);
    setLevel('sub-faction');
  };

  const handleBack = () => {
    setLevel('super-faction');
    setSelectedSuperFaction(null);
  };

  const handleFactionSelect = (faction: string) => {
    onSelect(faction);
    onClose();
  };

  if (!isOpen) return null;

  const title =
    level === 'super-faction'
      ? 'Select a faction'
      : selectedSuperFaction?.name || 'Select a faction';

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faction-picker-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 min-h-[56px]">
        <div className="flex items-center gap-2">
          {level === 'sub-faction' && (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back to categories"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h2
            id="faction-picker-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" role="listbox">
        {level === 'super-faction'
          ? // Stage 1: Super factions
            availableSuperFactions.map((sf) => (
              <button
                key={sf.id}
                type="button"
                onClick={() => handleSuperFactionSelect(sf)}
                role="option"
                aria-selected={false}
                className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between text-left border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100"
              >
                <span className="text-gray-900">{sf.name}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))
          : // Stage 2: Sub-factions
            availableFactions.map((faction) => (
              <button
                key={faction}
                type="button"
                onClick={() => handleFactionSelect(faction)}
                role="option"
                aria-selected={false}
                className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between text-left border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100"
              >
                <span className="text-gray-900">{faction}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ScorePickerCell } from '@/components/Inputs/ScorePickerCell';
import { ScorePickerPopover } from '@/components/Inputs/ScorePickerPopover';
import { useMatchupDefaultsStore } from '@/store';
import { SUPER_FACTIONS } from '@/data/factions';
import { ChevronRight } from 'lucide-react';

export function MatchupDefaultsPage() {
  const navigate = useNavigate();
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [activeOppFaction, setActiveOppFaction] = useState<string | null>(null);

  const { getDefault, setDefault, getDefaultsForFaction, clearDefaultsForFaction } =
    useMatchupDefaultsStore();

  const handleBack = () => {
    if (selectedFaction) {
      setSelectedFaction(null);
    } else {
      navigate('/');
    }
  };

  const handleScoreSelect = (score: number) => {
    if (selectedFaction && activeOppFaction) {
      setDefault(selectedFaction, activeOppFaction, score);
      setActiveOppFaction(null);
    }
  };

  const title = selectedFaction ? selectedFaction : 'Matchup Defaults';

  return (
    <Layout title={title} showBack onBack={handleBack}>
      <div className="flex flex-col gap-4 p-4 pb-8">
        {selectedFaction === null ? (
          <FactionList
            onSelect={setSelectedFaction}
            getDefaultsForFaction={getDefaultsForFaction}
          />
        ) : (
          <FactionDefaultsEditor
            selectedFaction={selectedFaction}
            getDefault={getDefault}
            onCellTap={setActiveOppFaction}
            onReset={() => clearDefaultsForFaction(selectedFaction)}
            customCount={Object.keys(getDefaultsForFaction(selectedFaction)).length}
          />
        )}
      </div>

      <ScorePickerPopover
        isOpen={activeOppFaction !== null}
        value={
          selectedFaction && activeOppFaction ? getDefault(selectedFaction, activeOppFaction) : 10
        }
        onSelect={handleScoreSelect}
        onClose={() => setActiveOppFaction(null)}
        ourFaction={selectedFaction ?? undefined}
        oppFaction={activeOppFaction ?? undefined}
      />
    </Layout>
  );
}

function FactionList({
  onSelect,
  getDefaultsForFaction,
}: {
  onSelect: (faction: string) => void;
  getDefaultsForFaction: (faction: string) => Record<string, number>;
}) {
  return (
    <>
      <p className="text-sm text-gray-500">
        Set default expected scores for faction matchups. These will pre-populate the matrix when
        you create a new game.
      </p>
      {SUPER_FACTIONS.map((sf) => (
        <section key={sf.id}>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            {sf.name}
          </h3>
          <div className="flex flex-col gap-1">
            {sf.factions.map((faction) => {
              const count = Object.keys(getDefaultsForFaction(faction)).length;
              return (
                <button
                  key={faction}
                  onClick={() => onSelect(faction)}
                  className="flex items-center justify-between gap-3 w-full px-3 py-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-h-[48px]"
                >
                  <span className="font-medium text-gray-900">{faction}</span>
                  <span className="flex items-center gap-2">
                    {count > 0 && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {count} custom
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function FactionDefaultsEditor({
  selectedFaction,
  getDefault,
  onCellTap,
  onReset,
  customCount,
}: {
  selectedFaction: string;
  getDefault: (ourFaction: string, oppFaction: string) => number;
  onCellTap: (oppFaction: string) => void;
  onReset: () => void;
  customCount: number;
}) {
  return (
    <>
      <p className="text-sm text-gray-500">
        Set the default expected score when{' '}
        <strong className="text-gray-700">{selectedFaction}</strong> plays against each opponent
        faction.
      </p>
      {SUPER_FACTIONS.map((sf) => {
        const factions = sf.factions.filter((f) => f !== selectedFaction);
        if (factions.length === 0) return null;

        return (
          <section key={sf.id}>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              {sf.name}
            </h3>
            <div className="flex flex-col gap-2">
              {factions.map((oppFaction) => (
                <div
                  key={oppFaction}
                  className="flex items-center justify-between gap-4 px-3 py-2 bg-gray-50 rounded-lg min-h-[48px]"
                >
                  <span className="flex-1 min-w-0 font-medium text-gray-900 truncate text-sm">
                    {oppFaction}
                  </span>
                  <ScorePickerCell
                    value={getDefault(selectedFaction, oppFaction)}
                    onTap={() => onCellTap(oppFaction)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {customCount > 0 && (
        <button
          onClick={onReset}
          className="w-full mt-2 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[48px]"
        >
          Reset All to 10
        </button>
      )}
    </>
  );
}

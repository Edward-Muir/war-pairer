import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MatchupDefaultsState {
  // defaults[ourFaction][oppFaction] = score (only stores non-10 values)
  defaults: Record<string, Record<string, number>>;
}

interface MatchupDefaultsActions {
  getDefault: (ourFaction: string, oppFaction: string) => number;
  setDefault: (ourFaction: string, oppFaction: string, score: number) => void;
  getDefaultsForFaction: (ourFaction: string) => Record<string, number>;
  clearDefaultsForFaction: (ourFaction: string) => void;
}

type MatchupDefaultsStore = MatchupDefaultsState & MatchupDefaultsActions;

export const useMatchupDefaultsStore = create<MatchupDefaultsStore>()(
  persist(
    (set, get) => ({
      defaults: {},

      getDefault: (ourFaction, oppFaction) => {
        return get().defaults[ourFaction]?.[oppFaction] ?? 10;
      },

      setDefault: (ourFaction, oppFaction, score) => {
        set((state) => {
          const newDefaults = { ...state.defaults };
          if (score === 10) {
            if (newDefaults[ourFaction]) {
              const factionDefaults = { ...newDefaults[ourFaction] };
              delete factionDefaults[oppFaction];
              if (Object.keys(factionDefaults).length === 0) {
                delete newDefaults[ourFaction];
              } else {
                newDefaults[ourFaction] = factionDefaults;
              }
            }
          } else {
            newDefaults[ourFaction] = {
              ...newDefaults[ourFaction],
              [oppFaction]: score,
            };
          }
          return { defaults: newDefaults };
        });
      },

      getDefaultsForFaction: (ourFaction) => {
        return get().defaults[ourFaction] ?? {};
      },

      clearDefaultsForFaction: (ourFaction) => {
        set((state) => {
          const newDefaults = { ...state.defaults };
          delete newDefaults[ourFaction];
          return { defaults: newDefaults };
        });
      },
    }),
    {
      name: 'uktc-matchup-defaults',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

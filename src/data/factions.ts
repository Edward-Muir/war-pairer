// Hierarchical faction data structure for two-stage picker
export interface SuperFaction {
  id: string;
  name: string;
  factions: readonly string[];
}

export const SUPER_FACTIONS: readonly SuperFaction[] = [
  {
    id: 'space-marines',
    name: 'Space Marines',
    factions: [
      'Black Templars',
      'Blood Angels',
      'Dark Angels',
      'Deathwatch',
      'Space Marines',
      'Space Wolves',
    ],
  },
  {
    id: 'imperium',
    name: 'Imperium',
    factions: [
      'Adepta Sororitas',
      'Adeptus Custodes',
      'Adeptus Mechanicus',
      'Astra Militarum',
      'Grey Knights',
      'Imperial Agents',
      'Imperial Knights',
    ],
  },
  {
    id: 'chaos',
    name: 'Chaos',
    factions: [
      'Chaos Daemons',
      'Chaos Knights',
      'Chaos Space Marines',
      'Death Guard',
      "Emperor's Children",
      'Thousand Sons',
      'World Eaters',
    ],
  },
  {
    id: 'aeldari',
    name: 'Aeldari',
    factions: ['Aeldari', 'Drukhari'],
  },
  {
    id: 'hive-mind',
    name: 'Forces of the Hive Mind',
    factions: ['Tyranids', 'Genestealer Cults'],
  },
  {
    id: 'xenos',
    name: 'Xenos',
    factions: ['Necrons', 'Orks', "T'au Empire", 'Leagues of Votann'],
  },
] as const;

// Derive flat FACTIONS array from SUPER_FACTIONS for backwards compatibility
export const FACTIONS = SUPER_FACTIONS.flatMap((sf) => sf.factions).sort() as readonly string[];

export type Faction = string;

// Helper function to filter super factions based on excluded factions
export function getAvailableSuperFactions(excludedFactions: string[]): SuperFaction[] {
  const excludedSet = new Set(excludedFactions.map((f) => f.toLowerCase()));
  return SUPER_FACTIONS.map((sf) => ({
    ...sf,
    factions: sf.factions.filter((f) => !excludedSet.has(f.toLowerCase())),
  })).filter((sf) => sf.factions.length > 0);
}

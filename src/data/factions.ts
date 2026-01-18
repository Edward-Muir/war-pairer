// Complete list of Warhammer 40K factions for autocomplete
export const FACTIONS = [
  // Imperium
  'Adepta Sororitas',
  'Adeptus Custodes',
  'Adeptus Mechanicus',
  'Astra Militarum',
  'Black Templars',
  'Blood Angels',
  'Dark Angels',
  'Deathwatch',
  'Grey Knights',
  'Imperial Agents',
  'Imperial Knights',
  'Space Marines',
  'Space Wolves',

  // Chaos
  'Chaos Daemons',
  'Chaos Knights',
  'Chaos Space Marines',
  'Death Guard',
  "Emperor's Children",
  'Thousand Sons',
  'World Eaters',

  // Xenos
  'Aeldari',
  'Drukhari',
  'Genestealer Cults',
  'Leagues of Votann',
  'Necrons',
  'Orks',
  "T'au Empire",
  'Tyranids',
] as const;

export type Faction = (typeof FACTIONS)[number];

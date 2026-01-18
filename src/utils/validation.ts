import type { Player } from '@/store/types';

/**
 * Result of faction validation
 */
export interface FactionValidationResult {
  isValid: boolean;
  errors: Record<string, string>; // keyed by `faction-${index}`
  duplicateGroups: Map<string, number[]>; // faction -> player indices with that faction
}

/**
 * Validates that all players have unique factions.
 * Empty factions are ignored (optional field).
 *
 * @param players - Array of players to validate
 * @returns Validation result with errors keyed by player index
 */
export function validateUniqueFactions(
  players: Player[]
): FactionValidationResult {
  const errors: Record<string, string> = {};
  const duplicateGroups = new Map<string, number[]>();

  // Group players by faction (case-insensitive, trimmed)
  const factionToIndices = new Map<string, number[]>();

  players.forEach((player, index) => {
    const faction = player.faction.trim();
    if (!faction) return; // Skip empty factions

    const normalizedFaction = faction.toLowerCase();
    const indices = factionToIndices.get(normalizedFaction) ?? [];
    indices.push(index);
    factionToIndices.set(normalizedFaction, indices);
  });

  // Find duplicates and generate errors
  factionToIndices.forEach((indices, _normalizedFaction) => {
    if (indices.length > 1) {
      // Find the display name (original case) for the faction
      const displayFaction = players[indices[0]].faction.trim();
      duplicateGroups.set(displayFaction, indices);

      // Generate error for each duplicate
      indices.forEach((index) => {
        errors[`faction-${index}`] = `Duplicate faction: ${displayFaction}`;
      });
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    duplicateGroups,
  };
}

/**
 * Gets list of factions already selected by other players.
 * Used to filter dropdown options in FactionAutocomplete.
 *
 * @param players - All players in the team
 * @param currentIndex - Index of the player being edited (excluded from result)
 * @returns Array of faction strings selected by other players
 */
export function getOtherSelectedFactions(
  players: Player[],
  currentIndex: number
): string[] {
  return players
    .filter((_, index) => index !== currentIndex)
    .map((p) => p.faction.trim())
    .filter((faction) => faction.length > 0);
}

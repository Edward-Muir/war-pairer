import type { Team, Game } from '@/store/types';

interface ExportData {
  version: string;
  exportedAt: string;
  teams: Team[];
  games: Game[];
}

/**
 * Export teams and games to a JSON file download
 */
export function exportToJson(
  teams: Team[],
  games: Game[],
  filename = 'uktc-pairing-data.json'
): void {
  const data: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    teams,
    games,
  };
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

/**
 * Import data from a JSON file
 * Returns parsed data or throws on invalid format
 */
export async function importFromJson(
  file: File
): Promise<{ teams: Team[]; games: Game[] }> {
  const text = await file.text();
  const data = JSON.parse(text) as ExportData;

  // Basic validation
  if (!data.teams || !Array.isArray(data.teams)) {
    throw new Error('Invalid file: missing teams array');
  }
  if (!data.games || !Array.isArray(data.games)) {
    throw new Error('Invalid file: missing games array');
  }

  return { teams: data.teams, games: data.games };
}

/**
 * Export a single game to JSON
 */
export function exportGameToJson(game: Game): void {
  const safeName = `${game.ourTeam.teamName}-vs-${game.opponentTeamName}`
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  const filename = `${safeName}-${date}.json`;
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    game,
  };
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

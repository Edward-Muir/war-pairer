import type { Team, Tournament } from '@/store/types';

interface ExportData {
  version: string;
  exportedAt: string;
  teams: Team[];
  tournaments: Tournament[];
}

/**
 * Export teams and tournaments to a JSON file download
 */
export function exportToJson(
  teams: Team[],
  tournaments: Tournament[],
  filename = 'uktc-pairing-data.json'
): void {
  const data: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    teams,
    tournaments,
  };
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

/**
 * Import data from a JSON file
 * Returns parsed data or throws on invalid format
 */
export async function importFromJson(
  file: File
): Promise<{ teams: Team[]; tournaments: Tournament[] }> {
  const text = await file.text();
  const data = JSON.parse(text) as ExportData;

  // Basic validation
  if (!data.teams || !Array.isArray(data.teams)) {
    throw new Error('Invalid file: missing teams array');
  }
  if (!data.tournaments || !Array.isArray(data.tournaments)) {
    throw new Error('Invalid file: missing tournaments array');
  }

  return { teams: data.teams, tournaments: data.tournaments };
}

/**
 * Export a single tournament to JSON
 */
export function exportTournamentToJson(tournament: Tournament): void {
  const safeName = tournament.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  const filename = `${safeName}-${date}.json`;
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tournament,
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

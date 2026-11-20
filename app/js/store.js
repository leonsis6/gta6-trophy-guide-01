// Progress persistence: earned trophy names in localStorage, plus export/import.
export const PROGRESS_KEY = 'gta6-trophy-guide-progress-v1';
export const SPOILER_KEY = 'gta6-trophy-guide-spoiler-v1';

/** Returns a Set of earned trophy names. */
export function loadEarned() {
  try {
    const v = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned]));
}

/** Downloads the earned list as JSON. */
export function exportEarned(earned) {
  const payload = { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned] };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * Parses an imported file (JSON array of names, or { earned: [...] }) and
 * returns the Set of names that match the official list. Throws on bad input.
 */
export async function importEarned(file, validNames) {
  const raw = JSON.parse(await file.text());
  const arr = Array.isArray(raw) ? raw : raw.earned;
  if (!Array.isArray(arr)) throw new Error('Expected a JSON array of trophy names (or { earned: [...] }).');
  const out = new Set();
  for (const name of arr) if (typeof name === 'string' && validNames.has(name)) out.add(name);
  return out;
}

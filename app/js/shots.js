// Fixed scenes for screenshots: ?shot=<scene> sets up a deterministic view.
// Progress is seeded (13 of 55 earned) so the screenshots show a guide in use;
// the seed only applies in ?shot= mode. window.__shotReady is set by main.js
// once painted.
import { PROGRESS_KEY } from './store.js';

// A fixed, spread-out set of 13 earned trophies: story openers, activities,
// a collectible and a misc trophy.
const SEED_IDS = [2, 3, 4, 5, 8, 9, 15, 16, 21, 30, 35, 42, 53];

/** Writes the seeded earned list to localStorage (call before re-reading it). */
export function seedShotProgress(byId) {
  const names = SEED_IDS.map((id) => byId.get(id).name);
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(names)); } catch { /* ignore */ }
}

/** Applies a scene's view state. `api` carries the guide's own functions. */
export function runShot(shot, query, api) {
  const { byId, switchTab, openModal, renderAll } = api;
  if (shot === 'guide') {
    // Detail pane for the missable trophy: full guide, warning, sources.
    openModal(byId.get(28));
  } else if (shot === 'roadmap') {
    switchTab('roadmap');
  } else if (shot === 'missable') {
    switchTab('missable');
  }
  // 'checklist' (default): the list view as-is.
  renderAll();
}

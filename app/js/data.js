// Loads the official trophy list (app/data/trophies.json) and labels its sources.
export const SOURCE_LABELS = {
  exophase: 'Exophase — official trophy list',
  psnprofiles: 'PSNProfiles — PSN trophy list',
  keengamer: 'KeenGamer — trophy guide & roadmap',
  pushsquare: 'Push Square — trophy guide & roadmap',
  own: 'our own advice from the official description, not yet checked in the game',
};

/** Fetches data/trophies.json and returns { trophies, meta }. */
export async function loadTrophies() {
  const res = await fetch('./data/trophies.json');
  if (!res.ok) throw new Error(`trophies.json: HTTP ${res.status}`);
  return res.json();
}

export const KIND_LABELS = {
  story: 'Story',
  stranger: 'Strangers',
  collectible: 'Collectibles',
  activity: 'Activities',
  combat: 'Combat',
  robbery: 'Robberies',
  misc: 'Misc',
};

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

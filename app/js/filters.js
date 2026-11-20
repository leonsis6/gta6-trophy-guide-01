// Filters: text search, grade, kind, earned status — and the spoiler rule.

/**
 * Returns the trophies matching the filters. `spoilersHidden` only affects
 * display (masking), not this selection: a hidden story trophy still matches.
 */
export function applyFilters(trophies, { q, grade, kind, status, earned }) {
  const needle = q.trim().toLowerCase();
  return trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (status === 'earned' && !earned.has(t.name)) return false;
    if (status === 'unearned' && earned.has(t.name)) return false;
    if (needle) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

/** A story trophy is masked while spoilers are hidden and it is not earned. */
export function isMasked(trophy, spoilersHidden, earned) {
  return trophy.story && spoilersHidden && !earned.has(trophy.name);
}

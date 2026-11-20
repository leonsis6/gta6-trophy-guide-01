// Platinum Road: boots the guide, renders the checklist, the detail modal,
// the roadmap and missable tabs, and the ?shot= scenes for screenshots.
import { loadTrophies, SOURCE_LABELS, KIND_LABELS, GRADE_LABELS } from './data.js';
import { PROGRESS_KEY, SPOILER_KEY, loadEarned, saveEarned, exportEarned, importEarned } from './store.js';
import { applyFilters, isMasked } from './filters.js';
import { runShot, seedShotProgress } from './shots.js';

const $ = (id) => document.getElementById(id);
const listEl = $('list');
const missableListEl = $('missable-list');

const doc = await loadTrophies();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const validNames = new Set(trophies.map((t) => t.name));

let earned = loadEarned();
let spoilersHidden = true;
try {
  const saved = localStorage.getItem(SPOILER_KEY);
  if (saved !== null) spoilersHidden = saved === '1';
} catch { /* private mode: keep default */ }

function gradeInitial(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] ?? '?';
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function renderProgress() {
  const total = trophies.length;
  const n = earned.size;
  $('progress-count').textContent = `${n} / ${total} earned`;
  $('progress-pct').textContent = `${Math.round((n / total) * 100)}%`;
  $('progress-fill').style.width = `${(n / total) * 100}%`;
  const counts = $('grade-counts');
  counts.replaceChildren();
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const have = trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
    const all = trophies.filter((t) => t.grade === g).length;
    const span = el('span');
    span.append(el('b', null, GRADE_LABELS[g]), document.createTextNode(` ${have}/${all}`));
    counts.append(span);
  }
}

function toggleEarned(name, on) {
  if (on) earned.add(name);
  else earned.delete(name);
  saveEarned(earned);
  renderAll();
}

function card(t) {
  const masked = isMasked(t, spoilersHidden, earned);
  const c = el('article', `card${earned.has(t.name) ? ' earned' : ''}${masked ? ' masked' : ''}`);
  const head = el('div', 'card-head');
  const dot = el('span', `grade-dot grade-${t.grade}`, gradeInitial(t.grade));
  dot.title = GRADE_LABELS[t.grade];
  head.append(dot);
  const h = el('h3', null, masked ? 'Hidden story trophy' : t.name);
  head.append(h);
  c.append(head);
  c.append(el('p', 'desc', masked ? 'Earn this trophy to reveal its name and description.' : t.description));
  if (!masked) {
    const preview = t.guide.length > 170 ? `${t.guide.slice(0, 170).trimEnd()}…` : t.guide;
    c.append(el('p', 'guide-preview', preview));
  }
  const tags = el('div', 'tags');
  tags.append(el('span', 'tag', KIND_LABELS[t.kind] ?? t.kind));
  if (t.missable) tags.append(el('span', 'tag missable', '⚠ Missable'));
  if (t.story && t.kind !== 'story') tags.append(el('span', 'tag story', 'Story'));
  c.append(tags);
  if (!masked) c.append(el('span', 'read-more', 'Read full guide →'));
  const check = el('label', 'check');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Mark ${t.name} earned`);
  box.addEventListener('change', (e) => { e.stopPropagation(); toggleEarned(t.name, box.checked); });
  check.append(box);
  c.append(check);
  c.addEventListener('click', (e) => {
    if (e.target === box) return;
    openModal(t);
  });
  return c;
}

function renderList() {
  const filters = {
    q: $('search').value,
    grade: $('grade').value,
    kind: $('kind').value,
    status: $('status').value,
    earned,
  };
  const shown = applyFilters(trophies, filters);
  listEl.replaceChildren(...shown.map(card));
  $('result-count').textContent = shown.length === trophies.length
    ? `${trophies.length} trophies`
    : `${shown.length} of ${trophies.length} trophies`;
  const missables = trophies.filter((t) => t.missable);
  missableListEl.replaceChildren(...missables.map(card));
}

function renderAll() {
  renderProgress();
  renderList();
  $('spoiler').checked = spoilersHidden;
  $('spoiler-label').textContent = spoilersHidden ? 'hidden' : 'shown';
}

function openModal(t) {
  const masked = isMasked(t, spoilersHidden, earned);
  const body = $('modal-body');
  body.replaceChildren();
  const head = el('div', 'card-head');
  head.append(el('span', `grade-dot grade-${t.grade}`, gradeInitial(t.grade)));
  const h = el('h2', null, masked ? 'Hidden story trophy' : t.name);
  h.id = 'modal-name';
  head.append(h);
  body.append(head);
  body.append(el('p', 'desc', masked
    ? 'This is a story trophy. Earn it in the game to reveal its name, description and guide — or turn spoilers off to show it now.'
    : t.description));
  const tags = el('div', 'tags');
  tags.append(el('span', 'tag', `${GRADE_LABELS[t.grade]} · ${KIND_LABELS[t.kind] ?? t.kind}`));
  if (t.missable) tags.append(el('span', 'tag missable', '⚠ Missable'));
  if (t.story && t.kind !== 'story') tags.append(el('span', 'tag story', 'Story'));
  body.append(tags);
  if (!masked) {
    body.append(el('h4', null, 'Guide'));
    body.append(el('p', null, t.guide));
    if (t.tip) {
      body.append(el('h4', null, 'Tip'));
      body.append(el('p', null, t.tip));
    }
    if (t.missable) {
      body.append(el('p', 'warn', 'Missable — the first meditation must happen with Lucia in Chapter 1, before you leave the chapter. See the Missable tab.'));
    }
    body.append(el('h4', null, 'Sources'));
    const src = el('p', 'src', `Sources: ${t.sources.map((s) => SOURCE_LABELS[s] ?? s).join('; ')}.`);
    body.append(src);
  }
  const row = el('label', 'earn-row');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.addEventListener('change', () => toggleEarned(t.name, box.checked));
  row.append(box, document.createTextNode(earned.has(t.name) ? 'Earned — nice work.' : 'Mark as earned'));
  body.append(row);
  $('modal').classList.remove('hidden');
}

function closeModal() {
  $('modal').classList.add('hidden');
}

function switchTab(name) {
  for (const b of document.querySelectorAll('.tab')) {
    const on = b.dataset.tab === name;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  }
  for (const v of document.querySelectorAll('.view')) v.classList.add('hidden');
  $(`view-${name}`).classList.remove('hidden');
}

for (const b of document.querySelectorAll('.tab')) {
  b.addEventListener('click', () => switchTab(b.dataset.tab));
}
$('modal-close').addEventListener('click', closeModal);
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
for (const id of ['search', 'grade', 'kind', 'status']) {
  $(id).addEventListener('input', renderList);
  $(id).addEventListener('change', renderList);
}
$('spoiler').addEventListener('change', (e) => {
  spoilersHidden = e.target.checked;
  try { localStorage.setItem(SPOILER_KEY, spoilersHidden ? '1' : '0'); } catch { /* ignore */ }
  renderAll();
});
$('export').addEventListener('click', () => exportEarned(earned));
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const next = await importEarned(file, validNames);
    earned = next;
    saveEarned(earned);
    renderAll();
  } catch (err) {
    alert(`Could not import that file: ${err.message}`);
  }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (!earned.size) return;
  if (confirm(`Clear all ${earned.size} earned trophies?`)) {
    earned = new Set();
    saveEarned(earned);
    renderAll();
  }
});

// Expose a small API for the screenshot scenes and for console checks.
window.__guide = { trophies, byId, get earned() { return earned; }, openModal, switchTab, renderAll };

renderAll();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  // Seed first, then re-read progress so the seeded ticks actually render.
  seedShotProgress(byId);
  earned = loadEarned();
  spoilersHidden = true;
  try { localStorage.setItem(SPOILER_KEY, '1'); } catch { /* ignore */ }
  runShot(shot, params, { byId, switchTab, openModal, renderAll });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
} else {
  window.__shotReady = true;
}

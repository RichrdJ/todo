'use strict';

/* ---------- Helpers ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem('klaar.' + k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('klaar.' + k, v); } catch {} },
};

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    // Session expired or logged out elsewhere: back to the login page, then return here.
    location.href = '/login?next=' + encodeURIComponent(location.pathname);
    return new Promise(() => {});
  }
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const addDays = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return ymd(d); };
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dayDiff = (s) => Math.round((parseYmd(s) - parseYmd(today())) / 864e5);
const WEEKDAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

function dueLabel(s) {
  const diff = dayDiff(s);
  if (diff === 0) return 'Vandaag';
  if (diff === 1) return 'Morgen';
  if (diff === -1) return 'Gisteren';
  if (diff > 1 && diff < 7) return WEEKDAYS[parseYmd(s).getDay()].replace(/^./, (c) => c.toUpperCase());
  const d = parseYmd(s);
  const opts = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('nl-NL', opts);
}

const ICONS = {
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  inbox: '<svg viewBox="0 0 24 24"><path d="M3 13l3-8h12l3 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13h5l1 3h6l1-3h5"/></svg>',
  flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  checkCircle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  notes: '<svg viewBox="0 0 24 24"><path d="M5 6h14M5 12h14M5 18h9"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  coffee: '<svg viewBox="0 0 24 24"><path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M9 9v12M15 9v12M3 15h18"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="13" height="13" rx="3"/><path d="M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
};

const PRIOS = [
  { v: 0, label: 'Geen', color: 'var(--text-3)' },
  { v: 1, label: 'Laag', color: 'var(--p1)' },
  { v: 2, label: 'Middel', color: 'var(--p2)' },
  { v: 3, label: 'Hoog', color: 'var(--p3)' },
];
const COLORS = [
  '#7c5cff', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#a3e635', '#eab308',
  '#f59e0b', '#f97316', '#ef4444', '#f43f5e', '#ec4899', '#d946ef', '#a16207', '#94a3b8',
];

/* ---------- State ---------- */
const state = {
  clients: [],
  projects: [],
  categories: [],
  todos: [],
  view: 'agenda', // the agenda is the home page
  agendaWeeks: [2, 3, 4].includes(Number(store.get('weeks'))) ? Number(store.get('weeks')) : 3,
  agendaOffset: 0, // weeks from the current week
  search: '',
  selected: null,
  collapsed: new Set(JSON.parse(store.get('collapsed') || '[]')),
  auth: {}, // { enabled, user, source: 'env' | 'app' | null } from /api/state
};
const byId = (id) => state.todos.find((t) => t.id === id);
const projectById = (id) => state.projects.find((p) => p.id === id);
const clientById = (id) => state.clients.find((c) => c.id === id);
const categoryById = (id) => state.categories.find((c) => c.id === id);

// The ways a todo can be grouped. A client is who the work is for (projects
// can belong to one), categories are labels for what kind of work it is.
const KINDS = {
  client: { list: 'clients', field: 'client_id', title: 'Klant', noun: 'klant', create: 'Nieuwe klant', placeholder: 'Bijv. Gemeente Utrecht' },
  project: { list: 'projects', field: 'project_id', title: 'Project', noun: 'project', create: 'Nieuw project', placeholder: 'Bijv. Migratie Suite4, Sprint 42' },
  category: { list: 'categories', field: 'category_ids', title: 'Categorie', noun: 'categorie', create: 'Nieuwe categorie', placeholder: 'Bijv. Overleg, Support, Ontwikkeling' },
};
const groupById = (kind, id) => state[KINDS[kind].list].find((g) => g.id === id);
// A task has one client and project, but any number of categories (labels).
const inGroup = (t, kind, id) => (kind === 'category' ? t.category_ids.includes(id) : t[KINDS[kind].field] === id);

const VIEWS = {
  agenda: { title: 'Agenda', icon: ICONS.grid, key: '1', filter: (t) => !t.done },
  today: { title: 'Vandaag', icon: ICONS.sun, key: '2', filter: (t) => !t.done && t.due && t.due <= today() },
  upcoming: { title: 'Gepland', icon: ICONS.calendar, key: '3', filter: (t) => !t.done && t.due },
  all: { title: 'Alle taken', icon: ICONS.inbox, key: '4', filter: (t) => !t.done },
  important: { title: 'Belangrijk', icon: ICONS.flag, key: '5', filter: (t) => !t.done && t.priority === 3 },
  done: { title: 'Voltooid', icon: ICONS.checkCircle, key: '6', filter: (t) => t.done },
};

/* Display preferences, kept per device like the theme and week count. */
const START_VIEWS = ['agenda', 'today', 'upcoming', 'all', 'important'];
const prefs = {
  get theme() { return store.get('theme') || 'system'; },
  get start() { const v = store.get('start'); return START_VIEWS.includes(v) ? v : 'agenda'; },
  get weekend() { return store.get('weekend') !== '0'; },
  get agendaDone() { return store.get('agendaDone') !== '0'; },
};
state.view = prefs.start;

/* The client, project or category whose view is open, if any. */
function currentScope() {
  const m = state.view.match(/^(client|project|category):(\d+)$/);
  const item = m && groupById(m[1], Number(m[2]));
  return item ? { kind: m[1], item } : null;
}

/* ---------- Quick-add parsing ---------- */
const DAY_ALIASES = { zo: 0, ma: 1, di: 2, wo: 3, do: 4, vr: 5, za: 6 };

function parseDate(word) {
  const w = word.toLowerCase();
  if (w === 'vandaag' || w === 'vd') return today();
  if (w === 'morgen' || w === 'mg') return addDays(1);
  if (w === 'overmorgen') return addDays(2);
  if (w === 'volgendeweek' || w === 'vw') {
    const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return ymd(d);
  }
  const short = w.slice(0, 2);
  if (short in DAY_ALIASES && WEEKDAYS[DAY_ALIASES[short]].startsWith(w)) {
    const d = new Date(); const delta = (DAY_ALIASES[short] - d.getDay() + 7) % 7 || 7;
    return addDays(delta);
  }
  let m = w.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return w;
  m = w.match(/^(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?$/);
  if (m) {
    const now = new Date();
    let year = m[3] ? Number(m[3].length === 2 ? '20' + m[3] : m[3]) : now.getFullYear();
    const d = new Date(year, Number(m[2]) - 1, Number(m[1]));
    if (d.getMonth() !== Number(m[2]) - 1) return null;
    if (!m[3] && ymd(d) < today()) d.setFullYear(year + 1);
    return ymd(d);
  }
  return null;
}

const norm = (s) => s.toLowerCase().replace(/\s+/g, '');
const exact = (list, q) => list.find((x) => norm(x.name) === q);
const prefix = (list, q) => list.find((x) => norm(x.name).startsWith(q));

function parseQuick(text) {
  const out = { title: text, priority: null, due: null, project: null, client: null, categories: [] };
  const words = [];
  for (const word of text.split(/\s+/)) {
    let m;
    if ((m = word.match(/^!(hoog|h|3|middel|m|2|laag|l|1)$/i))) {
      out.priority = { hoog: 3, h: 3, 3: 3, middel: 2, m: 2, 2: 2, laag: 1, l: 1, 1: 1 }[m[1].toLowerCase()];
    } else if (word === '!!!') {
      out.priority = 3;
    } else if ((m = word.match(/^@(.+)$/)) && parseDate(m[1])) {
      out.due = parseDate(m[1]);
    } else if ((m = word.match(/^#(.+)$/))) {
      // #naam: a project or a client; exact names win over prefixes.
      const q = m[1].toLowerCase();
      const p = exact(state.projects, q);
      const c = !p && exact(state.clients, q);
      const pp = !p && !c && prefix(state.projects, q);
      const cc = !p && !c && !pp && prefix(state.clients, q);
      if (p || pp) out.project = p || pp;
      else if (c || cc) out.client = c || cc;
      else words.push(word);
    } else if ((m = word.match(/^\+(.+)$/))) {
      const q = m[1].toLowerCase();
      const cat = exact(state.categories, q) || prefix(state.categories, q);
      if (cat) { if (!out.categories.includes(cat)) out.categories.push(cat); } else words.push(word);
    } else {
      words.push(word);
    }
  }
  out.title = words.join(' ').trim();
  return out;
}

/* ---------- Rendering ---------- */
function counts() {
  const open = state.todos.filter((t) => !t.done);
  const c = {};
  for (const [k, v] of Object.entries(VIEWS)) c[k] = state.todos.filter(v.filter).length;
  for (const [kind, k] of Object.entries(KINDS)) {
    for (const g of state[k.list]) c[kind + ':' + g.id] = open.filter((t) => inGroup(t, kind, g.id)).length;
  }
  return c;
}

function renderSidebar() {
  const c = counts();
  $('#nav').innerHTML = Object.entries(VIEWS).map(([k, v]) => `
    <button class="nav-item ${state.view === k && !state.search ? 'active' : ''}" data-view="${k}">
      <span class="nav-icon">${v.icon}</span><span class="label">${v.title}</span>
      <span class="count">${k === 'done' || k === 'agenda' ? '' : c[k] || ''}</span>
    </button>`).join('');

  const row = (kind, g, cls = '') => `
    <div class="nav-item ${cls} ${state.view === kind + ':' + g.id && !state.search ? 'active' : ''}" data-view="${kind}:${g.id}" data-kind="${kind}" data-id="${g.id}" role="button" tabindex="0">
      ${kind === 'client' ? `<span class="dot client" style="background:${g.color}"></span>` : `<span class="nav-icon muted">${kind === 'project' ? ICONS.folder : ICONS.tag}</span>`}
      <span class="label">${esc(g.name)}</span>
      <span class="count">${c[kind + ':' + g.id] || ''}</span>
      <span class="proj-actions">
        <button class="icon-btn small" data-act="edit" title="Bewerken">${ICONS.edit}</button>
        <button class="icon-btn small danger" data-act="delete" title="Verwijderen">${ICONS.trash}</button>
      </span>
    </div>`;
  const hint = (text) => `<div class="empty-hint">${text}</div>`;
  $('#clients').innerHTML = state.clients.map((cl) => row('client', cl)
    + state.projects.filter((p) => p.client_id === cl.id).map((p) => row('project', p, 'sub')).join('')).join('')
    || hint('Nog geen klanten');
  $('#projects').innerHTML = state.projects.filter((p) => !p.client_id).map((p) => row('project', p)).join('')
    || hint('Projecten zonder klant, bijv. intern');
  $('#categories').innerHTML = state.categories.map((g) => row('category', g)).join('')
    || hint('Bijv. Overleg, Support');

  const dark = document.documentElement.dataset.theme === 'dark'
    || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  $('#themeToggle').innerHTML = dark ? ICONS.sun : ICONS.moon;
  $('#brandDate').textContent = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' });
}

function viewGroups() {
  const t0 = today();
  const posSort = (a, b) => a.position - b.position || a.id - b.id;
  const doneSort = (a, b) => (b.completed_at || '').localeCompare(a.completed_at || '');

  if (state.search) {
    const q = state.search.toLowerCase();
    const names = (t) => [clientById(t.client_id), projectById(t.project_id), ...t.category_ids.map(categoryById)]
      .filter(Boolean).map((g) => g.name.toLowerCase()).join(' ');
    const hits = state.todos.filter((t) => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q) || names(t).includes(q));
    return [
      { key: 's-open', items: hits.filter((t) => !t.done).sort(posSort) },
      { key: 's-done', label: 'Voltooid', items: hits.filter((t) => t.done).sort(doneSort), collapsible: true },
    ];
  }

  const scope = currentScope();
  if (scope) {
    const { kind, item } = scope;
    const mine = state.todos.filter((t) => inGroup(t, kind, item.id));
    const open = mine.filter((t) => !t.done).sort(posSort);
    const done = { key: kind + '-done', label: 'Voltooid', items: mine.filter((t) => t.done).sort(doneSort), collapsible: true };
    if (kind !== 'client') return [{ key: kind + '-open', items: open, sortable: true }, done];
    // A client's tasks, grouped by its projects.
    const projects = state.projects.filter((p) => p.client_id === item.id);
    const inProject = new Set(projects.map((p) => p.id));
    return [
      { key: 'c-general', label: projects.length ? 'Algemeen' : '', items: open.filter((t) => !inProject.has(t.project_id)), sortable: true },
      ...projects.map((p) => ({ key: 'c-p' + p.id, label: p.name, items: open.filter((t) => t.project_id === p.id), sortable: true })),
      done,
    ];
  }

  const items = state.todos.filter(VIEWS[state.view].filter);
  switch (state.view) {
    case 'today': {
      const doneToday = state.todos.filter((t) => t.done && t.completed_at && ymd(new Date(t.completed_at)) === t0);
      return [
        { key: 'overdue', label: 'Te laat', cls: 'overdue', items: items.filter((t) => t.due < t0).sort((a, b) => a.due.localeCompare(b.due) || posSort(a, b)) },
        { key: 'today', label: 'Vandaag', items: items.filter((t) => t.due === t0).sort(posSort), sortable: true },
        { key: 'today-done', label: 'Afgerond vandaag', items: doneToday.sort(doneSort), collapsible: true },
      ];
    }
    case 'upcoming': {
      const groups = new Map();
      for (const t of items.sort((a, b) => a.due.localeCompare(b.due) || posSort(a, b))) {
        const key = t.due < t0 ? 'overdue' : t.due;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(t);
      }
      return [...groups].map(([key, list]) => ({
        key: 'u-' + key,
        label: key === 'overdue' ? 'Te laat' : dueLabel(key) + (dayDiff(key) > 1 ? ' · ' + parseYmd(key).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : ''),
        cls: key === 'overdue' ? 'overdue' : '',
        items: list,
        sortable: key !== 'overdue',
      }));
    }
    case 'done':
      return [{ key: 'done', items: items.sort(doneSort) }];
    default:
      return [{ key: state.view, items: items.sort(posSort), sortable: true }];
  }
}

function renderTodo(t, sortable) {
  const scope = currentScope();
  const cl = t.client_id ? clientById(t.client_id) : null;
  const p = t.project_id ? projectById(t.project_id) : null;
  const labels = t.category_ids.filter((id) => !(scope?.kind === 'category' && scope.item.id === id)).map(categoryById).filter(Boolean);
  const meta = [];
  // Client and project are implied by a client or project view (and its group headers).
  if ((cl || p) && (!scope || scope.kind === 'category')) {
    // Only clients carry a colour; a project without a client gets a neutral folder icon.
    const mark = cl ? `<i class="dot" style="background:${cl.color}"></i>` : ICONS.folder;
    meta.push(`<span>${mark}${[cl, p].filter(Boolean).map((g) => esc(g.name)).join(' › ')}</span>`);
  }
  for (const cat of labels) meta.push(`<span class="cat">${esc(cat.name)}</span>`);
  if (t.due) {
    const d = dayDiff(t.due);
    const cls = t.done ? '' : d < 0 ? 'overdue' : d === 0 ? 'today' : '';
    meta.push(`<span class="due ${cls}">${ICONS.calendar}${dueLabel(t.due)}</span>`);
  }
  if (t.notes.trim()) meta.push(`<span title="Heeft notities">${ICONS.notes}</span>`);
  return `
    <li class="todo p${t.priority} ${t.done ? 'done' : ''} ${state.selected === t.id ? 'selected' : ''}" data-id="${t.id}" ${sortable ? 'draggable="true"' : ''}>
      <button class="check" data-act="toggle" aria-label="${t.done ? 'Markeer als open' : 'Afvinken'}">${ICONS.check}</button>
      <div class="body">
        <div class="title">${esc(t.title)}</div>
        <div class="meta">${meta.join('')}</div>
      </div>
      ${t.done ? '' : `<button class="icon-btn row-act" data-act="snooze" aria-label="Uitstellen" title="Uitstellen">${ICONS.clock}</button>`}
      <button class="icon-btn row-act" data-act="duplicate" aria-label="Dupliceren" title="Dupliceren">${ICONS.copy}</button>
      <button class="icon-btn row-act danger" data-act="delete" aria-label="Verwijderen" title="Verwijderen">${ICONS.trash}</button>
    </li>`;
}

function emptyState() {
  if (state.search) return { icon: ICONS.search, h: 'Niets gevonden', p: `Geen taken die “${esc(state.search)}” bevatten.` };
  if (state.view === 'today') return { icon: ICONS.coffee, h: 'Alles klaar voor vandaag', p: 'Tijd voor koffie. Of plan iets met @vandaag.' };
  if (state.view === 'done') return { icon: ICONS.checkCircle, h: 'Nog niets afgerond', p: 'Afgevinkte taken verschijnen hier.' };
  if (state.view === 'important') return { icon: ICONS.flag, h: 'Geen urgente zaken', p: 'Taken met prioriteit hoog (!hoog) komen hier.' };
  if (state.view === 'upcoming') return { icon: ICONS.calendar, h: 'Niets gepland', p: 'Geef een taak een datum, bijv. @vrijdag.' };
  return { icon: ICONS.inbox, h: 'Lekker leeg', p: 'Voeg hierboven je eerste taak toe.' };
}

/* ---------- Agenda ---------- */
const isAgenda = () => state.view === 'agenda' && !state.search;

function agendaRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + state.agendaOffset * 7); // Monday
  const days = Array.from({ length: state.agendaWeeks * 7 }, (_, i) => addDays(i, start));
  return { days, from: days[0], to: days[days.length - 1] };
}

function renderAgendaItem(t) {
  const cl = t.client_id ? clientById(t.client_id) : null;
  const p = t.project_id ? projectById(t.project_id) : null;
  const tip = [t.title, [cl, p].filter(Boolean).map((g) => g.name).join(' › ')].filter(Boolean).join(' — ');
  return `
    <li class="ag-item p${t.priority} ${t.done ? 'done' : ''} ${state.selected === t.id ? 'selected' : ''}" data-id="${t.id}" draggable="true"
        style="--cc:${cl ? cl.color : 'var(--border-strong)'}" title="${esc(tip)}">
      <button class="mini-check" data-act="toggle" aria-label="${t.done ? 'Markeer als open' : 'Afvinken'}">${ICONS.check}</button>
      <span class="ag-title">${esc(t.title)}</span>
      ${t.done ? '' : `<button class="ag-snooze" data-act="snooze" aria-label="Uitstellen" title="Uitstellen">${ICONS.clock}</button>`}
    </li>`;
}

function renderAgenda() {
  const { days } = agendaRange();
  const t0 = today();
  const posSort = (a, b) => b.priority - a.priority || a.position - b.position || a.id - b.id;
  const byDay = new Map(days.map((d) => [d, []]));
  for (const t of state.todos) if (t.due && byDay.has(t.due)) byDay.get(t.due).push(t);

  // With the weekend switched off, Saturday and Sunday still show up when a task is planned on one.
  const weekend = prefs.weekend
    || days.some((d, i) => i % 7 > 4 && d >= t0 && byDay.get(d).some((t) => !t.done));
  const weekdays = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].slice(0, weekend ? 7 : 5);
  let html = `<div class="agenda"><div class="cal ${weekend ? '' : 'no-weekend'}">`;
  html += weekdays.map((w, i) => `<div class="cal-wd ${i > 4 ? 'weekend' : ''}">${w}</div>`).join('');
  days.forEach((d, i) => {
    if (!weekend && i % 7 > 4) return;
    const date = parseYmd(d);
    const items = byDay.get(d);
    // Open tasks from past days live in the "Te laat" tray, so past days only show what got done.
    const open = d < t0 ? [] : items.filter((t) => !t.done).sort(posSort);
    const done = prefs.agendaDone ? items.filter((t) => t.done) : [];
    const month = i === 0 || date.getDate() === 1 ? date.toLocaleDateString('nl-NL', { month: 'short' }) : '';
    html += `
      <div class="day ${d === t0 ? 'is-today' : ''} ${d < t0 ? 'is-past' : ''} ${i % 7 > 4 ? 'weekend' : ''}" data-date="${d}">
        <div class="day-head">
          <span class="dname">${WEEKDAYS[date.getDay()]}</span>
          <span class="dnum">${date.getDate()}</span><span class="dmonth">${month}</span>
          <button class="day-add" data-act="add-day" title="Taak op ${dueLabel(d).toLowerCase()}" aria-label="Taak toevoegen">${ICONS.plus}</button>
        </div>
        <ul class="day-items">${open.map(renderAgendaItem).join('')}${done.map(renderAgendaItem).join('')}</ul>
      </div>`;
  });
  html += '</div>';

  const overdue = state.todos.filter((t) => !t.done && t.due && t.due < t0).sort((a, b) => a.due.localeCompare(b.due));
  const undated = state.todos.filter((t) => !t.done && !t.due).sort(posSort);
  const section = (key, label, items, hint) => `
    <section class="tray-sec ${key}" data-date="${key === 'undated' ? '' : 'keep'}">
      <h4>${label} <span class="n">${items.length}</span></h4>
      ${items.length ? `<ul class="day-items">${items.map(renderAgendaItem).join('')}</ul>` : `<p class="tray-hint">${hint}</p>`}
    </section>`;
  html += `<aside class="tray">
    ${overdue.length ? section('overdue', 'Te laat', overdue, '') : ''}
    ${section('undated', 'Nog inplannen', undated, 'Taken zonder datum komen hier. Sleep ze naar een dag om ze in te plannen.')}
  </aside></div>`;
  $('#listWrap').innerHTML = html;
}

function renderAgendaTools() {
  const tools = $('#viewTools');
  if (!isAgenda()) { tools.innerHTML = ''; return; }
  tools.innerHTML = `
    <div class="seg mini">${[2, 3, 4].map((w) => `<button class="${state.agendaWeeks === w ? 'on' : ''}" data-weeks="${w}">${w} wk</button>`).join('')}</div>
    <div class="nav-btns">
      <button class="icon-btn" data-agenda="-1" title="Vorige week" aria-label="Vorige week">${ICONS.left}</button>
      <button class="btn ghost small" data-agenda="0" ${state.agendaOffset === 0 ? 'disabled' : ''}>Deze week</button>
      <button class="icon-btn" data-agenda="1" title="Volgende week" aria-label="Volgende week">${ICONS.right}</button>
    </div>`;
}

function renderList() {
  document.querySelector('.main').classList.toggle('wide', isAgenda());
  if (isAgenda()) return renderAgenda();
  const groups = viewGroups().filter((g) => g.items.length);
  const hasOpen = groups.some((g) => !g.collapsible);
  let html = '';
  if (!hasOpen) {
    const e = emptyState();
    html += `<div class="empty"><div class="art">${e.icon}</div><h3>${e.h}</h3><p>${e.p}</p></div>`;
  }
  for (const g of groups) {
    const collapsed = g.collapsible && !state.collapsed.has(g.key + ':open');
    const head = g.label
      ? `<div class="group-head ${g.cls || ''}">${g.collapsible
          ? `<button data-act="collapse" data-group="${g.key}">${ICONS.chev}${g.label} <span class="n">${g.items.length}</span></button>`
          : `${g.label} <span class="n">${g.items.length}</span>`}</div>`
      : '';
    const sortable = g.sortable && !state.search;
    html += `<div class="group ${collapsed ? 'collapsed' : ''}" data-group="${g.key}">${head}
      <ul class="todos">${g.items.map((t) => renderTodo(t, sortable)).join('')}</ul></div>`;
  }
  $('#listWrap').innerHTML = html;
}

function renderHeader() {
  const scope = currentScope();
  const title = state.search ? 'Zoekresultaten' : scope ? scope.item.name : VIEWS[state.view].title;
  $('#viewTitle').textContent = title;
  document.title = `${title} · ToDo`;

  let sub = '';
  const progress = $('#progress');
  progress.hidden = true;
  if (!state.search && state.view === 'today') {
    const d = new Date();
    sub = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
    const open = state.todos.filter(VIEWS.today.filter).length;
    const done = state.todos.filter((t) => t.done && t.completed_at && ymd(new Date(t.completed_at)) === today()).length;
    const total = open + done;
    if (total) {
      progress.hidden = false;
      $('#progressBar').style.strokeDashoffset = 113.1 * (1 - done / total);
      $('#progressText').textContent = `${Math.round((done / total) * 100)}%`;
      sub += ` · ${done} van ${total} afgerond`;
    }
  } else {
    const n = state.search ? null : viewGroups().filter((g) => !g.collapsible).reduce((s, g) => s + g.items.length, 0);
    if (n !== null) sub = state.view === 'done' ? `${n} afgerond` : `${n} open ${n === 1 ? 'taak' : 'taken'}`;
    if (scope) sub = `${KINDS[scope.kind].title} · ${sub}`;
  }
  if (isAgenda()) {
    const { from, to } = agendaRange();
    const fmt = (d) => parseYmd(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    const planned = state.todos.filter((t) => !t.done && t.due && t.due >= from && t.due <= to).length;
    sub = `${fmt(from)} – ${fmt(to)} · ${planned} gepland`;
  }
  $('#viewSub').textContent = sub.replace(/^./, (c) => c.toUpperCase());
  renderAgendaTools();

  const ph = scope
    ? `Nieuwe taak ${scope.kind === 'client' ? 'voor' : 'in'} ${scope.item.name}…`
    : 'Nieuwe taak…  probeer: Notulen sturen @morgen !hoog #klant +overleg';
  $('#newTitle').placeholder = ph;
}

function renderDrawer() {
  const drawer = $('#drawer');
  const t = state.selected && byId(state.selected);
  if (!t) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    return;
  }
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  const created = new Date(t.created_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const completed = t.completed_at && new Date(t.completed_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  drawer.innerHTML = `
    <div class="drawer-inner todo p${t.priority} ${t.done ? 'done' : ''}" data-id="${t.id}" style="cursor:auto;border:0;border-radius:0;background:none;animation:none">
      <div class="drawer-top">
        <button class="btn ghost" data-act="toggle">${t.done ? 'Heropenen' : 'Markeer als klaar'}</button>
        <span class="spacer"></span>
        <button class="icon-btn" data-act="duplicate" title="Dupliceren (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'}D)" aria-label="Dupliceren">${ICONS.copy}</button>
        <button class="icon-btn danger" data-act="delete" title="Verwijderen" aria-label="Verwijderen">${ICONS.trash}</button>
        <button class="icon-btn" data-act="close" title="Sluiten (Esc)" aria-label="Sluiten">${ICONS.x}</button>
      </div>
      <div class="drawer-title-row">
        <button class="check" data-act="toggle" aria-label="Afvinken">${ICONS.check}</button>
        <textarea class="title-input" id="dTitle" rows="1" maxlength="500">${esc(t.title)}</textarea>
      </div>
      <div class="field">
        <label>Prioriteit</label>
        <div class="seg" id="dPrio">${PRIOS.map((p) => `
          <button class="${t.priority === p.v ? 'on' : ''}" data-prio="${p.v}"><i class="dot" style="background:${p.color}"></i>${p.label}</button>`).join('')}
        </div>
      </div>
      <div class="field">
        <label for="dDue">Deadline</label>
        <input type="date" id="dDue" value="${t.due || ''}">
        <div class="date-row">
          ${snoozeOptions(t).map((o) => `<button class="pill" data-due="${o.due ?? ''}" title="${o.due ? shortDate(o.due) : ''}">${o.label}</button>`).join('')}
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="dClient">Klant</label>
          <select id="dClient">
            <option value="">Geen klant</option>
            ${options(state.clients, t.client_id)}
            <option value="new">+ Nieuwe klant…</option>
          </select>
        </div>
        <div class="field">
          <label for="dProject">Project</label>
          <select id="dProject">
            <option value="">Geen project</option>
            ${projectOptions(t)}
            <option value="new">+ Nieuw project…</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Categorieën</label>
        <div class="labels">
          ${state.categories.map((c) => `
            <button class="label-pill ${t.category_ids.includes(c.id) ? 'on' : ''}" data-label="${c.id}" aria-pressed="${t.category_ids.includes(c.id)}">${ICONS.tag}${esc(c.name)}</button>`).join('')}
          <button class="label-pill add" data-act="new-label">${ICONS.plus}Nieuw</button>
        </div>
      </div>
      <div class="field">
        <label for="dNotes">Notities</label>
        <textarea class="notes" id="dNotes" placeholder="Context, links, afspraken…">${esc(t.notes)}</textarea>
      </div>
      <div class="stamp">Aangemaakt ${created}${completed ? ` · Afgerond ${completed}` : ''}</div>
    </div>`;
  autosize($('#dTitle'));
}

function options(list, selected) {
  return list.map((g) => `<option value="${g.id}" ${g.id === selected ? 'selected' : ''}>${esc(g.name)}</option>`).join('');
}

/* Projects of the todo's client first (or all, grouped by client), then those without a client. */
function projectOptions(t) {
  const groups = t.client_id
    ? [[clientById(t.client_id)?.name || '', state.projects.filter((p) => p.client_id === t.client_id)]]
    : state.clients.map((c) => [c.name, state.projects.filter((p) => p.client_id === c.id)]);
  groups.push(['Zonder klant', state.projects.filter((p) => !p.client_id)]);
  return groups.filter(([, list]) => list.length)
    .map(([name, list]) => `<optgroup label="${esc(name)}">${options(list, t.project_id)}</optgroup>`).join('');
}

function autosize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

function render() {
  renderSidebar();
  renderHeader();
  renderList();
  renderDrawer();
}

/* Re-render everything except a drawer the user is typing in. */
function refresh() {
  renderSidebar();
  renderHeader();
  renderList();
}

/* ---------- Actions ---------- */
function replaceTodo(t) {
  const i = state.todos.findIndex((x) => x.id === t.id);
  if (i >= 0) state.todos[i] = t; else state.todos.push(t);
}

async function updateTodo(id, patch, { drawer = false } = {}) {
  const t = byId(id);
  if (!t) return;
  Object.assign(t, patch);
  refresh();
  if (drawer) renderDrawer();
  try {
    replaceTodo(await api('PATCH', `/api/todos/${id}`, patch));
    refresh();
    if (drawer) renderDrawer();
  } catch (e) { toast('Opslaan mislukt: ' + e.message); load(); }
}

async function toggleTodo(id) {
  const t = byId(id);
  const el = document.querySelector(`#listWrap .todo[data-id="${id}"]`);
  if (!t.done && el) {
    el.classList.add('checking');
    await new Promise((r) => setTimeout(r, 380));
    el.classList.add('leaving');
    await new Promise((r) => setTimeout(r, 220));
  }
  const done = !t.done;
  t.completed_at = done ? new Date().toISOString() : null;
  await updateTodo(id, { done }, { drawer: state.selected === id });
  if (done) toast('Taak afgerond', 'Ongedaan maken', () => updateTodo(id, { done: false }, { drawer: state.selected === id }));
}

/* ---------- Snooze ---------- */
const shortDate = (d) => parseYmd(d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });

/* One-click dates for postponing a task; options equal to its current date (or each other) are left out. */
function snoozeOptions(t) {
  const from = t.due && t.due > today() ? parseYmd(t.due) : new Date();
  const opts = [
    { label: 'Vandaag', due: today() },
    { label: 'Morgen', due: addDays(1) },
    { label: 'Overmorgen', due: addDays(2) },
    { label: 'Volgende maandag', due: parseDate('volgendeweek') },
    { label: 'Een week later', due: addDays(7, from) },
  ];
  const seen = new Set([t.due]);
  const out = opts.filter((o) => !seen.has(o.due) && seen.add(o.due));
  if (t.due) out.push({ label: 'Geen datum', due: null });
  return out;
}

async function snoozeTodo(id, due) {
  const before = byId(id).due;
  if (before === due) return;
  await updateTodo(id, { due }, { drawer: state.selected === id });
  toast(due ? `Verzet naar ${dueLabel(due).toLowerCase()}` : 'Datum verwijderd', 'Ongedaan maken',
    () => updateTodo(id, { due: before }, { drawer: state.selected === id }));
}

function closeSnoozeMenu() {
  document.getElementById('snoozeMenu')?.remove();
}

function openSnoozeMenu(anchor, id) {
  const wasOpenFor = document.getElementById('snoozeMenu')?.dataset.id;
  closeSnoozeMenu();
  if (wasOpenFor === String(id)) return; // second click on the same button closes it
  const t = byId(id);
  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.id = 'snoozeMenu';
  menu.dataset.id = id;
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `<div class="menu-head">Verzetten naar</div>${snoozeOptions(t).map((o) => `
    <button role="menuitem" data-snooze="${o.due ?? ''}"><span>${o.label}</span><span class="menu-hint">${o.due ? shortDate(o.due) : ''}</span></button>`).join('')}`;
  document.body.append(menu);
  const r = anchor.getBoundingClientRect();
  const left = Math.min(Math.max(8, r.right - menu.offsetWidth), innerWidth - menu.offsetWidth - 8);
  const top = r.bottom + 6 + menu.offsetHeight > innerHeight ? r.top - menu.offsetHeight - 6 : r.bottom + 6;
  menu.style.left = left + 'px';
  menu.style.top = Math.max(8, top) + 'px';
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-snooze]');
    if (!b) return;
    closeSnoozeMenu();
    snoozeTodo(id, b.dataset.snooze || null);
  });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('button')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Escape') { e.stopPropagation(); closeSnoozeMenu(); anchor.focus(); }
  });
  menu.querySelector('button').focus();
}

// Close the snooze menu on any click outside it, and when the page scrolls or resizes.
document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('#snoozeMenu, [data-act="snooze"]')) closeSnoozeMenu();
});
addEventListener('resize', closeSnoozeMenu);
document.addEventListener('scroll', closeSnoozeMenu, true);

/* Copy a task (open, right below the original) and open the copy with its title selected for renaming. */
async function duplicateTodo(id) {
  const t = byId(id);
  if (!t) return;
  const { title, notes, priority, due, client_id, project_id, category_ids, position } = t;
  try {
    const copy = await api('POST', '/api/todos', { title, notes, priority, due, client_id, project_id, category_ids, position: position + 0.001 });
    replaceTodo(copy);
    state.selected = copy.id;
    render();
    const input = $('#dTitle');
    input.focus();
    input.select();
    toast('Taak gedupliceerd', 'Ongedaan maken', () => deleteTodo(copy.id));
  } catch (e) { toast('Dupliceren mislukt: ' + e.message); }
}

async function deleteTodo(id) {
  const t = byId(id);
  if (!t) return;
  state.todos = state.todos.filter((x) => x.id !== id);
  if (state.selected === id) state.selected = null;
  render();
  try {
    await api('DELETE', `/api/todos/${id}`);
    toast('Taak verwijderd', 'Ongedaan maken', async () => {
      const { title, notes, priority, due, client_id, project_id, category_ids, position, done } = t;
      replaceTodo(await api('POST', '/api/todos', { title, notes, priority, due, client_id, project_id, category_ids, position, done }));
      render();
    });
  } catch (e) { toast('Verwijderen mislukt: ' + e.message); load(); }
}

async function addTodo(text, { due } = {}) {
  const q = parseQuick(text);
  if (!q.title) return;
  const scope = currentScope();
  const body = { title: q.title, priority: q.priority ?? (state.view === 'important' && !state.search ? 3 : 0) };
  if (q.due) body.due = q.due;
  else if (due) body.due = due;
  else if (state.view === 'today' && !state.search) body.due = today();
  else if (state.view === 'upcoming' && !state.search) body.due = addDays(1);
  if (q.project) body.project_id = q.project.id;
  else if (q.client) body.client_id = q.client.id;
  else if (scope?.kind === 'project') body.project_id = scope.item.id;
  else if (scope?.kind === 'client') body.client_id = scope.item.id;
  const labels = new Set(q.categories.map((c) => c.id));
  if (scope?.kind === 'category') labels.add(scope.item.id);
  if (labels.size) body.category_ids = [...labels];
  try {
    replaceTodo(await api('POST', '/api/todos', body));
    refresh();
    if (!VIEWS[state.view] || state.search) return;
    const t = state.todos[state.todos.length - 1];
    if (!VIEWS[state.view].filter(t)) toast(`Toegevoegd aan ${t.due ? dueLabel(t.due) : 'Alle taken'}`);
  } catch (e) { toast('Toevoegen mislukt: ' + e.message); }
}

async function reorder(ids) {
  const map = new Map(state.todos.filter((t) => ids.includes(t.id)).map((t) => [t.id, t.position]));
  const slots = [...map.values()].sort((a, b) => a - b);
  ids.forEach((id, i) => { byId(id).position = slots[i]; });
  refresh();
  try { await api('POST', '/api/todos/reorder', { ids }); await load(); }
  catch (e) { toast('Volgorde opslaan mislukt'); load(); }
}

/* Inline "new task" field inside an agenda day. Quick-add tokens work here too. */
function openDayInput(day) {
  if (!day || day.querySelector('.day-input')) return;
  const input = document.createElement('input');
  input.className = 'day-input';
  input.placeholder = 'Nieuwe taak…';
  input.maxLength = 500;
  day.querySelector('.day-items').append(input);
  input.focus();
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    const text = input.value.trim();
    input.remove();
    if (save && text) addTodo(text, { due: day.dataset.date });
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') { e.stopPropagation(); finish(false); }
  });
  input.addEventListener('blur', () => finish(true));
}

function setView(view) {
  state.view = view;
  state.search = '';
  $('#search').value = '';
  document.body.classList.remove('nav-open');
  render();
}

/* ---------- Clients, projects & categories ---------- */
function groupDialog(kind, item, defaults = {}) {
  const K = KINDS[kind];
  return new Promise((resolve) => {
    // Colours other clients already use are greyed out, so every client stays recognisable.
    // A client's own colour stays available; once the palette runs out, reuse is allowed again.
    const taken = new Map(kind === 'client'
      ? state.clients.filter((c) => !item || c.id !== item.id).map((c) => [c.color.toLowerCase(), c.name])
      : []);
    const exhausted = COLORS.every((c) => taken.has(c));
    if (exhausted) taken.clear();
    let color = item ? item.color : COLORS.find((c) => !taken.has(c)) || COLORS[0];
    const scope = currentScope();
    const clientId = item ? item.client_id
      : 'client_id' in defaults ? defaults.client_id
      : scope?.kind === 'client' ? scope.item.id : null;
    const modal = $('#modal');
    modal.innerHTML = `
      <form class="box">
        <h3>${item ? `${K.title} bewerken` : K.create}</h3>
        <input class="input" name="name" placeholder="${K.placeholder}" value="${item ? esc(item.name) : ''}" maxlength="80" required>
        ${kind === 'project' ? `
          <label class="dlg-label" for="dlgClient">Klant</label>
          <select class="input" id="dlgClient" name="client">
            <option value="">Geen klant (intern)</option>
            ${options(state.clients, clientId)}
          </select>` : ''}
        ${kind === 'client' ? `<div class="swatches">${COLORS.map((c) => taken.has(c)
          ? `<button type="button" class="swatch" style="--sw:${c}" disabled title="In gebruik door ${esc(taken.get(c))}" aria-label="Kleur in gebruik door ${esc(taken.get(c))}"></button>`
          : `<button type="button" class="swatch ${c === color ? 'on' : ''}" data-color="${c}" style="--sw:${c}" aria-label="Kleur ${c}"></button>`).join('')}</div>
          ${exhausted ? '<p class="dlg-note">Alle kleuren zijn in gebruik, dus je kunt er een dubbel kiezen.</p>' : ''}` : ''}
        <div class="actions">
          <button type="button" class="btn ghost" data-act="cancel">Annuleren</button>
          <button type="submit" class="btn primary">${item ? 'Opslaan' : 'Aanmaken'}</button>
        </div>
      </form>`;
    modal.hidden = false;
    const form = $('form', modal);
    const close = (val) => { modal.hidden = true; modal.innerHTML = ''; resolve(val); };
    form.name.focus();
    form.name.select();
    form.addEventListener('click', (e) => {
      const sw = e.target.closest('[data-color]');
      if (sw) {
        color = sw.dataset.color;
        form.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('on', s === sw));
      }
      if (e.target.closest('[data-act="cancel"]')) close(null);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      if (!name) return;
      const res = kind === 'client' ? { name, color } : { name };
      if (kind === 'project') res.client_id = form.client.value ? Number(form.client.value) : null;
      close(res);
    });
    modal.onclick = (e) => { if (e.target === modal) close(null); };
    modal.onkeydown = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(null); } };
  });
}

function confirmDialog(title, text, okLabel = 'Verwijderen') {
  return new Promise((resolve) => {
    const modal = $('#modal');
    modal.innerHTML = `
      <div class="box" role="alertdialog">
        <h3>${esc(title)}</h3><p>${esc(text)}</p>
        <div class="actions">
          <button class="btn ghost" data-act="no">Annuleren</button>
          <button class="btn danger" data-act="yes">${esc(okLabel)}</button>
        </div>
      </div>`;
    modal.hidden = false;
    $('[data-act="yes"]', modal).focus();
    const close = (v) => { modal.hidden = true; modal.innerHTML = ''; resolve(v); };
    modal.onclick = (e) => {
      if (e.target === modal || e.target.closest('[data-act="no"]')) close(false);
      if (e.target.closest('[data-act="yes"]')) close(true);
    };
    modal.onkeydown = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(false); } };
  });
}

async function addGroup(kind) {
  const res = await groupDialog(kind, null);
  if (!res) return;
  try {
    const g = await api('POST', `/api/${KINDS[kind].list}`, res);
    state[KINDS[kind].list].push(g);
    setView(kind + ':' + g.id);
  } catch (e) { toast('Aanmaken mislukt: ' + e.message); }
}

/* Create a category from the details panel and put it straight on the task. */
/* Create a client, project or category from the details panel and link it to the task straight away. */
async function newGroupFor(todoId, kind) {
  const t = byId(todoId);
  // A new project defaults to the task's client.
  const res = await groupDialog(kind, null, kind === 'project' ? { client_id: t.client_id } : {});
  if (!res) return renderDrawer(); // reset the select that triggered this
  try {
    const g = await api('POST', `/api/${KINDS[kind].list}`, res);
    state[KINDS[kind].list].push(g);
    const patch = kind === 'category' ? { category_ids: [...t.category_ids, g.id] } : { [KINDS[kind].field]: g.id };
    await updateTodo(todoId, patch, { drawer: true });
    toast(`${KINDS[kind].title} “${g.name}” aangemaakt en gekoppeld`);
  } catch (e) { toast('Aanmaken mislukt: ' + e.message); renderDrawer(); }
}

async function editGroup(kind, id) {
  const res = await groupDialog(kind, groupById(kind, id));
  if (!res) return;
  try {
    await api('PATCH', `/api/${KINDS[kind].list}/${id}`, res);
    await load(); // moving a project to another client also moves its tasks
  } catch (e) { toast('Opslaan mislukt: ' + e.message); }
}

async function deleteGroup(kind, id) {
  const K = KINDS[kind];
  const g = groupById(kind, id);
  const n = state.todos.filter((t) => inGroup(t, kind, id)).length;
  const extra = kind === 'client' && state.projects.some((p) => p.client_id === id) ? ' Projecten van deze klant blijven ook bestaan.' : '';
  const ok = await confirmDialog(`“${g.name}” verwijderen?`, (n
    ? `De ${n} ${n === 1 ? 'taak blijft' : 'taken blijven'} bewaard, maar zonder ${K.noun}.`
    : `Deze ${K.noun} heeft geen taken.`) + extra);
  if (!ok) return;
  try {
    await api('DELETE', `/api/${K.list}/${id}`);
    if (state.view === kind + ':' + id) state.view = 'all';
    await load();
  } catch (e) { toast('Verwijderen mislukt: ' + e.message); }
}

/* ---------- Settings ---------- */
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
  store.set('theme', theme === 'system' ? '' : theme);
  renderSidebar();
}

const switchRow = (pref, title, hint, on) => `
  <label class="set-row">
    <span class="set-label"><b>${title}</b><span>${hint}</span></span>
    <input type="checkbox" role="switch" class="switch" data-pref="${pref}" aria-label="${title}" ${on ? 'checked' : ''}>
  </label>`;

function settingsDialog() {
  const modal = $('#modal');
  let mode = null; // the open login form: 'setup', 'change' or 'off'
  const seg = (pref, options, current) => `<div class="seg mini" data-seg="${pref}" style="grid-template-columns:repeat(${options.length}, auto)">${options.map(([v, label]) =>
    `<button type="button" class="${String(current) === String(v) ? 'on' : ''}" data-value="${v}">${label}</button>`).join('')}</div>`;
  modal.innerHTML = `
    <div class="box settings" role="dialog" aria-modal="true" aria-labelledby="setTitle">
      <div class="set-head">
        <h3 id="setTitle">Instellingen</h3>
        <button class="icon-btn" data-act="close" title="Sluiten (Esc)" aria-label="Sluiten">${ICONS.x}</button>
      </div>
      <section class="set-sec">
        <h4>Weergave</h4>
        <div class="set-row">
          <span class="set-label"><b>Thema</b></span>
          ${seg('theme', [['light', 'Licht'], ['dark', 'Donker'], ['system', 'Systeem']], prefs.theme)}
        </div>
        <div class="set-row">
          <label class="set-label" for="setStart"><b>Startpagina</b><span>Hier opent de app, en hier brengt het logo je heen</span></label>
          <select class="input" id="setStart">${START_VIEWS.map((v) => `<option value="${v}" ${prefs.start === v ? 'selected' : ''}>${VIEWS[v].title}</option>`).join('')}</select>
        </div>
        <div class="set-row">
          <span class="set-label"><b>Agenda</b><span>Aantal weken dat je ziet</span></span>
          ${seg('weeks', [[2, '2 wk'], [3, '3 wk'], [4, '4 wk']], state.agendaWeeks)}
        </div>
        ${switchRow('weekend', 'Weekend in de agenda', 'Zaterdag en zondag; staat er een taak op, dan zie je ze altijd', prefs.weekend)}
        ${switchRow('agendaDone', 'Afgeronde taken in de agenda', 'Afgevinkte taken blijven doorgestreept op hun dag staan', prefs.agendaDone)}
        <p class="set-note">Deze instellingen gelden voor dit apparaat.</p>
      </section>
      <section class="set-sec" id="setLogin"></section>
    </div>`;
  modal.hidden = false;

  const login = $('#setLogin');
  const renderLogin = () => {
    const a = state.auth;
    if (a.source === 'env') {
      login.innerHTML = `
        <h4>Inloggen</h4>
        <p class="set-text">Inloggen staat aan als <b>${esc(a.user)}</b>. Dat is ingesteld met <code>APP_PASSWORD_HASH</code> of <code>APP_PASSWORD</code> in je stack- of compose-bestand; wijzig of verwijder het daar.</p>
        <div class="set-actions"><button type="button" class="btn small" data-act="others">Andere apparaten uitloggen</button></div>`;
      return;
    }
    const on = a.enabled ? mode !== 'off' : mode === 'setup';
    let body = '';
    if (mode === 'setup' || mode === 'change') {
      body = `
        <form class="set-form" data-form="${mode}">
          ${mode === 'change' ? '<label class="set-field"><span>Huidig wachtwoord</span><input class="input" type="password" name="current" autocomplete="current-password" required></label>' : ''}
          <label class="set-field"><span>Gebruikersnaam</span><input class="input" name="username" autocomplete="username" maxlength="80" required value="${esc(a.user || 'admin')}"></label>
          <label class="set-field"><span>${mode === 'change' ? 'Nieuw wachtwoord' : 'Wachtwoord'}</span><input class="input" type="password" name="password" autocomplete="new-password" minlength="8" required placeholder="Minimaal 8 tekens"></label>
          <label class="set-field"><span>Herhaal wachtwoord</span><input class="input" type="password" name="repeat" autocomplete="new-password" minlength="8" required></label>
          <p class="set-error" hidden></p>
          <p class="set-note">${mode === 'change' ? 'Andere apparaten worden uitgelogd; hier blijf je ingelogd.' : 'Je blijft op dit apparaat ingelogd. Wachtwoord kwijt? Zie <i>Inloggen</i> in de README.'}</p>
          <div class="set-actions">
            <button type="button" class="btn ghost small" data-act="cancel">Annuleren</button>
            <button type="submit" class="btn primary small">${mode === 'change' ? 'Opslaan' : 'Inloggen aanzetten'}</button>
          </div>
        </form>`;
    } else if (mode === 'off') {
      body = `
        <form class="set-form" data-form="off">
          <label class="set-field"><span>Huidig wachtwoord</span><input class="input" type="password" name="current" autocomplete="current-password" required></label>
          <p class="set-error" hidden></p>
          <p class="set-note">Zonder inlog kan iedereen die de app kan bereiken bij je taken. Alle apparaten worden uitgelogd.</p>
          <div class="set-actions">
            <button type="button" class="btn ghost small" data-act="cancel">Annuleren</button>
            <button type="submit" class="btn danger small">Inloggen uitzetten</button>
          </div>
        </form>`;
    } else if (a.enabled) {
      body = `
        <p class="set-text">Je bent ingelogd als <b>${esc(a.user)}</b>.</p>
        <div class="set-actions">
          <button type="button" class="btn small" data-act="change">Wachtwoord wijzigen</button>
          <button type="button" class="btn ghost small" data-act="others">Andere apparaten uitloggen</button>
        </div>`;
    }
    login.innerHTML = `
      <h4>Inloggen</h4>
      ${switchRow('login', 'Inloggen vereist', 'Vraag om gebruikersnaam en wachtwoord voordat je bij je taken kunt', on)}
      ${body}`;
    $('.set-form input:not([value]), .set-form input[name="current"]', login)?.focus();
  };
  renderLogin();

  const close = () => { modal.hidden = true; modal.innerHTML = ''; modal.onsubmit = modal.onchange = null; $('#settingsBtn').focus(); };
  modal.onclick = (e) => {
    if (e.target === modal || e.target.closest('[data-act="close"]')) return close();
    const segBtn = e.target.closest('[data-seg] [data-value]');
    if (segBtn) {
      const pref = segBtn.parentElement.dataset.seg;
      segBtn.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === segBtn));
      if (pref === 'theme') applyTheme(segBtn.dataset.value);
      if (pref === 'weeks') { state.agendaWeeks = Number(segBtn.dataset.value); store.set('weeks', state.agendaWeeks); renderHeader(); renderList(); }
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'change') { mode = 'change'; renderLogin(); }
    if (act === 'cancel') { mode = null; renderLogin(); }
    if (act === 'others') {
      api('DELETE', '/api/sessions/others')
        .then((r) => toast(r.ended ? `${r.ended} ${r.ended === 1 ? 'andere sessie' : 'andere sessies'} uitgelogd` : 'Geen andere apparaten ingelogd'))
        .catch((err) => toast('Uitloggen mislukt: ' + err.message));
    }
  };
  modal.onchange = (e) => {
    const pref = e.target.dataset.pref;
    if (e.target.id === 'setStart') store.set('start', e.target.value);
    if (pref === 'weekend' || pref === 'agendaDone') { store.set(pref, e.target.checked ? '1' : '0'); renderList(); }
    if (pref === 'login') { mode = state.auth.enabled ? (e.target.checked ? null : 'off') : (e.target.checked ? 'setup' : null); renderLogin(); }
  };
  modal.onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const error = $('.set-error', f);
    const fail = (msg) => { error.textContent = msg; error.hidden = false; };
    if (f.dataset.form !== 'off' && f.password.value !== f.repeat.value) return fail('De wachtwoorden zijn niet gelijk.');
    const button = $('[type="submit"]', f);
    button.disabled = true;
    try {
      if (f.dataset.form === 'off') {
        await api('DELETE', '/api/auth', { current_password: f.current.value });
        toast('Inloggen staat uit');
      } else {
        await api('POST', '/api/auth', { current_password: f.current?.value, username: f.username.value.trim(), password: f.password.value });
        toast(f.dataset.form === 'change' ? 'Inlog gewijzigd' : 'Inloggen staat aan');
      }
      mode = null;
      await load();
      renderLogin();
    } catch (err) {
      button.disabled = false;
      fail(err.message);
    }
  };
  modal.onkeydown = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  $('[data-act="close"]', modal).focus();
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg, actionLabel, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button>${esc(actionLabel)}</button>` : ''}`;
  el.classList.add('show');
  if (actionLabel) $('button', el).onclick = () => { el.classList.remove('show'); action(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), actionLabel ? 5000 : 2600);
}

/* ---------- Events ---------- */
function bind() {
  let dragId = null; // id of the todo being dragged, shared by list and sidebar drop targets
  $('#nav').addEventListener('click', (e) => {
    const item = e.target.closest('[data-view]');
    if (item) setView(item.dataset.view);
  });

  const groupsEl = $('#groups');
  groupsEl.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) return addGroup(add.dataset.add);
    const item = e.target.closest('[data-kind]');
    if (!item) return;
    const { kind } = item.dataset;
    const id = Number(item.dataset.id);
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'edit') return editGroup(kind, id);
    if (act === 'delete') return deleteGroup(kind, id);
    setView(kind + ':' + id);
  });
  groupsEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset.kind) setView(e.target.dataset.view);
  });

  // Drop a todo on a client, project, category or "Vandaag" in the sidebar.
  const sidebar = $('#sidebar');
  sidebar.addEventListener('dragover', (e) => {
    const target = e.target.closest('[data-kind], [data-view="today"]');
    if (!target || !dragId) return;
    e.preventDefault();
    sidebar.querySelectorAll('.drop-target').forEach((x) => x !== target && x.classList.remove('drop-target'));
    target.classList.add('drop-target');
  });
  sidebar.addEventListener('dragleave', (e) => e.target.closest?.('.drop-target')?.classList.remove('drop-target'));
  sidebar.addEventListener('drop', (e) => {
    const target = e.target.closest('[data-kind], [data-view="today"]');
    sidebar.querySelectorAll('.drop-target').forEach((x) => x.classList.remove('drop-target'));
    if (!target || !dragId) return;
    e.preventDefault();
    const { kind } = target.dataset;
    const id = Number(target.dataset.id);
    if (kind === 'category') {
      const t = byId(dragId);
      if (!t.category_ids.includes(id)) updateTodo(dragId, { category_ids: [...t.category_ids, id] });
      toast(`Label “${categoryById(id).name}” toegevoegd`);
    } else if (kind) updateTodo(dragId, { [KINDS[kind].field]: id });
    else updateTodo(dragId, { due: today() });
  });

  $('#search').addEventListener('input', (e) => {
    state.search = e.target.value.trim();
    refresh();
  });
  $('#search').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.target.value = ''; state.search = ''; e.target.blur(); refresh(); } });

  const input = $('#newTitle');
  $('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    renderChips();
    addTodo(text);
  });
  input.addEventListener('input', renderChips);
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; renderChips(); input.blur(); } });

  $('#viewTools').addEventListener('click', (e) => {
    const weeks = e.target.closest('[data-weeks]');
    if (weeks) { state.agendaWeeks = Number(weeks.dataset.weeks); store.set('weeks', state.agendaWeeks); }
    const nav = e.target.closest('[data-agenda]');
    if (nav) state.agendaOffset = Number(nav.dataset.agenda) === 0 ? 0 : state.agendaOffset + Number(nav.dataset.agenda);
    if (weeks || nav) { renderHeader(); renderList(); }
  });
  $('#brandHome').addEventListener('click', () => { state.agendaOffset = 0; setView(prefs.start); });

  const list = $('#listWrap');
  list.addEventListener('click', (e) => {
    const addDay = e.target.closest('[data-act="add-day"]');
    if (addDay) return openDayInput(addDay.closest('.day'));
    const collapse = e.target.closest('[data-act="collapse"]');
    if (collapse) {
      const key = collapse.dataset.group + ':open';
      state.collapsed.has(key) ? state.collapsed.delete(key) : state.collapsed.add(key);
      store.set('collapsed', JSON.stringify([...state.collapsed]));
      return renderList();
    }
    const li = e.target.closest('.todo, .ag-item');
    if (!li) return;
    const id = Number(li.dataset.id);
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'toggle') return toggleTodo(id);
    if (act === 'delete') return deleteTodo(id);
    if (act === 'duplicate') return duplicateTodo(id);
    if (act === 'snooze') return openSnoozeMenu(e.target.closest('[data-act]'), id);
    state.selected = state.selected === id ? null : id;
    renderList();
    renderDrawer();
    if (state.selected && innerWidth > 820) setTimeout(() => $('#dTitle')?.focus(), 50);
  });

  // Agenda: drag a task onto a day to (re)schedule it, or onto "Nog inplannen" to clear its date.
  const dayTarget = (e) => e.target.closest?.('.day, .tray-sec.undated');
  list.addEventListener('dragover', (e) => {
    const target = dayTarget(e);
    if (!target || !dragId) return;
    e.preventDefault();
    list.querySelectorAll('.drop-target').forEach((x) => x !== target && x.classList.remove('drop-target'));
    target.classList.add('drop-target');
  });
  list.addEventListener('dragleave', (e) => {
    const target = dayTarget(e);
    if (target && !target.contains(e.relatedTarget)) target.classList.remove('drop-target');
  });
  list.addEventListener('drop', (e) => {
    const target = dayTarget(e);
    if (!target || !dragId) return;
    e.preventDefault();
    target.classList.remove('drop-target');
    const due = target.dataset.date || null;
    if (byId(dragId).due !== due) updateTodo(dragId, { due }, { drawer: state.selected === dragId });
  });

  // Drag & drop reordering within a group.
  list.addEventListener('dragstart', (e) => {
    const ag = e.target.closest('.ag-item');
    if (ag) {
      dragId = Number(ag.dataset.id);
      ag.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(dragId));
      return;
    }
    const li = e.target.closest('.todo[draggable]');
    if (!li) return;
    dragId = Number(li.dataset.id);
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragId));
  });
  list.addEventListener('dragend', () => {
    dragId = null;
    list.querySelectorAll('.dragging, .drag-over-top, .drag-over-bottom, .drop-target').forEach((x) => x.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom', 'drop-target'));
  });
  list.addEventListener('dragover', (e) => {
    const li = e.target.closest('.todo[draggable]');
    if (!li || !dragId) return;
    const src = list.querySelector(`.todo[data-id="${dragId}"]`);
    if (li.parentElement !== src.parentElement) return;
    e.preventDefault();
    const after = e.clientY > li.getBoundingClientRect().top + li.offsetHeight / 2;
    list.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((x) => x.classList.remove('drag-over-top', 'drag-over-bottom'));
    if (li !== src) li.classList.add(after ? 'drag-over-bottom' : 'drag-over-top');
  });
  list.addEventListener('drop', (e) => {
    const li = e.target.closest('.todo[draggable]');
    if (!li || !dragId) return;
    e.preventDefault();
    const src = list.querySelector(`.todo[data-id="${dragId}"]`);
    if (li === src || li.parentElement !== src.parentElement) return;
    const after = li.classList.contains('drag-over-bottom');
    li[after ? 'after' : 'before'](src);
    reorder([...src.parentElement.children].map((x) => Number(x.dataset.id)));
  });

  const drawer = $('#drawer');
  drawer.addEventListener('click', (e) => {
    const id = state.selected;
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'close') { state.selected = null; renderList(); return renderDrawer(); }
    if (act === 'toggle') return toggleTodo(id);
    if (act === 'delete') return deleteTodo(id);
    if (act === 'duplicate') return duplicateTodo(id);
    if (act === 'snooze') return openSnoozeMenu(e.target.closest('[data-act]'), id);
    const prio = e.target.closest('[data-prio]');
    if (prio) return updateTodo(id, { priority: Number(prio.dataset.prio) }, { drawer: true });
    const label = e.target.closest('[data-label]');
    if (label) {
      const cid = Number(label.dataset.label);
      const ids = byId(id).category_ids;
      return updateTodo(id, { category_ids: ids.includes(cid) ? ids.filter((x) => x !== cid) : [...ids, cid] }, { drawer: true });
    }
    if (act === 'new-label') return newGroupFor(id, 'category');
    const due = e.target.closest('[data-due]');
    if (due) return snoozeTodo(id, due.dataset.due || null);
  });
  let saveTimer;
  drawer.addEventListener('input', (e) => {
    const id = state.selected;
    if (e.target.id === 'dTitle') {
      autosize(e.target);
      clearTimeout(saveTimer);
      const title = e.target.value.replace(/\n/g, ' ').trim();
      if (title) saveTimer = setTimeout(() => updateTodo(id, { title }), 400);
    }
    if (e.target.id === 'dNotes') {
      clearTimeout(saveTimer);
      const notes = e.target.value;
      saveTimer = setTimeout(() => updateTodo(id, { notes }), 500);
    }
  });
  drawer.addEventListener('keydown', (e) => {
    if (e.target.id === 'dTitle' && e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
  });
  drawer.addEventListener('change', (e) => {
    const id = state.selected;
    if (e.target.id === 'dDue') updateTodo(id, { due: e.target.value || null }, { drawer: true });
    const kind = { dClient: 'client', dProject: 'project' }[e.target.id];
    if (kind && e.target.value === 'new') return newGroupFor(id, kind);
    const ref = kind && KINDS[kind].field;
    if (ref) updateTodo(id, { [ref]: e.target.value ? Number(e.target.value) : null }, { drawer: true });
  });

  $('#themeToggle').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    applyTheme(dark ? 'light' : 'dark');
  });
  // Following the system theme: keep the toggle's icon in step when the system switches.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderSidebar);
  $('#settingsBtn').addEventListener('click', settingsDialog);

  $('#logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    location.href = '/login';
  });

  $('#menuBtn').addEventListener('click', () => document.body.classList.add('nav-open'));
  $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if (!$('#modal').hidden) return;
    if (e.key === 'Escape') {
      if (state.selected) { state.selected = null; renderList(); renderDrawer(); }
      document.body.classList.remove('nav-open');
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#search').focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && state.selected) { e.preventDefault(); duplicateTodo(state.selected); }
      return;
    }
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); $('#newTitle').focus(); }
    else if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
    else if (e.key === ',') { e.preventDefault(); settingsDialog(); }
    else {
      const view = Object.entries(VIEWS).find(([, v]) => v.key === e.key);
      if (view) setView(view[0]);
    }
  });

  // Roll "today" over at midnight and pick up changes from other devices.
  let lastDay = today();
  setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
}

function renderChips() {
  const text = $('#newTitle').value;
  const q = parseQuick(text);
  const chips = [];
  if (q.due) chips.push(`<span class="chip">${ICONS.calendar}${dueLabel(q.due)}</span>`);
  if (q.priority) chips.push(`<span class="chip" style="color:${PRIOS[q.priority].color};background:color-mix(in srgb, ${PRIOS[q.priority].color} 14%, transparent)">${ICONS.flag}${PRIOS[q.priority].label}</span>`);
  if (q.client) chips.push(`<span class="chip" style="color:${q.client.color};background:color-mix(in srgb, ${q.client.color} 14%, transparent)">${ICONS.briefcase}${esc(q.client.name)}</span>`);
  for (const cat of q.categories) chips.push(`<span class="chip neutral">${ICONS.tag}${esc(cat.name)}</span>`);
  if (q.project) chips.push(`<span class="chip neutral">${ICONS.folder}${esc(q.project.name)}</span>`);
  const el = $('#chips');
  el.innerHTML = chips.join('');
  el.classList.toggle('show', chips.length > 0);
}

/* ---------- Boot ---------- */
async function load() {
  try {
    const data = await api('GET', '/api/state');
    const auth = state.auth = data.auth || {};
    $('#logoutBtn').hidden = !auth.enabled;
    if (auth.enabled) $('#logoutBtn').title = `Uitloggen (${auth.user})`;
    state.clients = data.clients || [];
    state.projects = data.projects;
    state.categories = data.categories || [];
    const v = data.version || 'dev';
    $('#version').textContent = /^\d/.test(v) ? 'v' + v : v;
    state.todos = data.todos.map((t) => ({ ...t, category_ids: t.category_ids || [] }));
    if (/^(client|project|category):/.test(state.view) && !currentScope()) state.view = 'today';
    if (state.selected && !byId(state.selected)) state.selected = null;
    const editing = $('#drawer').contains(document.activeElement);
    editing ? refresh() : render();
  } catch (e) {
    toast('Kan de server niet bereiken');
  }
}

bind();
load();

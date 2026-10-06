// App state: per market, a list of saved house profiles plus settings shared
// by every house (your tax situation, stock assumptions, your own home/HELOC).
import { DEFAULTS } from './defaults';
import { compareRentalVsStocks, projectRental, simulateCashDamming } from './finance';
import { SCENARIOS, applyScenario } from './scenarios';

export const STORAGE_KEY = 'renting-model:v3';
const SHARED_KEYS = ['tax', 'stocks', 'damming', 'scenarios'];
export const MARKETS = ['CA', 'VN'];

const uid = () => Math.random().toString(36).slice(2, 10);

const houseFields = (market, src = DEFAULTS[market]) => {
  const out = {};
  for (const k of Object.keys(DEFAULTS[market])) {
    if (k !== 'market' && !SHARED_KEYS.includes(k)) out[k] = src[k] ?? DEFAULTS[market][k];
  }
  return out;
};

const sharedFields = (market, src = {}) => {
  const d = DEFAULTS[market];
  return {
    tax: { ...d.tax, ...src.tax },
    stocks: { ...d.stocks, ...src.stocks },
    damming: d.damming && { ...d.damming, ...src.damming },
    scenarios: {
      bear: { ...d.scenarios.bear, ...src.scenarios?.bear },
      bull: { ...d.scenarios.bull, ...src.scenarios?.bull },
    },
  };
};

export const newProfile = (market, name, inputs, source) => ({
  id: uid(),
  name,
  inputs: houseFields(market, inputs),
  ...(source ? { source } : {}),
});

const cleanSource = (src) =>
  src && typeof src.sheetId === 'string' && typeof src.tab === 'string' ? { sheetId: src.sheetId, tab: src.tab } : undefined;

export function initialState() {
  const state = { market: 'CA', tab: 'rental', scenario: 'base', shared: {}, profiles: {}, active: {}, sources: {} };
  for (const m of MARKETS) {
    const first = newProfile(m, m === 'VN' ? 'Căn hộ 1' : 'House 1');
    state.shared[m] = sharedFields(m);
    state.profiles[m] = [first];
    state.active[m] = first.id;
  }
  return state;
}

// Accepts anything (localStorage, an imported file) and returns a valid state,
// filling fields added in later versions from defaults.
export function normalize(raw) {
  const base = initialState();
  if (!raw || typeof raw !== 'object') return base;
  const state = {
    ...base,
    market: MARKETS.includes(raw.market) ? raw.market : 'CA',
    tab: raw.tab || 'rental',
    scenario: SCENARIOS.includes(raw.scenario) ? raw.scenario : 'base',
  };
  for (const m of MARKETS) {
    state.shared[m] = sharedFields(m, raw.shared?.[m]);
    const list = Array.isArray(raw.profiles?.[m]) ? raw.profiles[m] : [];
    const profiles = list
      .filter((x) => x && typeof x === 'object')
      .map((x) => {
        const source = cleanSource(x.source);
        return { id: String(x.id || uid()), name: String(x.name || 'House').slice(0, 60), inputs: houseFields(m, x.inputs || {}), ...(source ? { source } : {}) };
      });
    state.profiles[m] = profiles.length ? profiles : base.profiles[m];
    const active = raw.active?.[m];
    state.active[m] = state.profiles[m].some((x) => x.id === active) ? active : state.profiles[m][0].id;
  }
  for (const [id, src] of Object.entries(raw.sources || {})) {
    if (src && typeof src.url === 'string') state.sources[id] = { url: src.url, market: MARKETS.includes(src.market) ? src.market : 'CA', lastSync: src.lastSync || null };
  }
  return state;
}

export function loadState() {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return initialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode); app still works for the session
  }
}

export const activeProfile = (s) => s.profiles[s.market].find((x) => x.id === s.active[s.market]);

// Full model input for one house: house fields + shared settings.
export const inputsFor = (market, profile, shared) => ({ market, ...profile.inputs, ...shared });

const setPath = (obj, path, value) => {
  const [head, ...rest] = path.split('.');
  return { ...obj, [head]: rest.length ? setPath(obj[head], rest.join('.'), value) : value };
};

const mapProfiles = (s, fn) => ({ ...s, profiles: { ...s.profiles, [s.market]: fn(s.profiles[s.market]) } });

export const actions = {
  set: (path, value) => (s) => {
    const m = s.market;
    if (SHARED_KEYS.includes(path.split('.')[0])) {
      return { ...s, shared: { ...s.shared, [m]: setPath(s.shared[m], path, value) } };
    }
    return mapProfiles(s, (list) => list.map((x) => (x.id === s.active[m] ? { ...x, inputs: setPath(x.inputs, path, value) } : x)));
  },
  resetHouse: () => (s) =>
    mapProfiles(s, (list) => list.map((x) => (x.id === s.active[s.market] ? { ...x, inputs: houseFields(s.market) } : x))),
  resetShared: () => (s) => ({ ...s, shared: { ...s.shared, [s.market]: sharedFields(s.market) } }),
  select: (id) => (s) => ({ ...s, active: { ...s.active, [s.market]: id } }),
  add: (name, fromInputs) => (s) => {
    const p = newProfile(s.market, name, fromInputs);
    return { ...mapProfiles(s, (list) => [...list, p]), active: { ...s.active, [s.market]: p.id } };
  },
  rename: (id, name) => (s) => mapProfiles(s, (list) => list.map((x) => (x.id === id ? { ...x, name: name.slice(0, 60) } : x))),
  // Create or refresh the houses that come from one linked sheet. Houses are
  // matched by (sheet, tab name); the sheet wins over local edits. Fields the
  // sheet leaves out fall back to defaults. Houses whose tab disappeared are
  // kept but unlinked so nothing is silently deleted.
  applySheet: (sheetId, url, houses, now = Date.now()) => (s) => {
    const profiles = { ...s.profiles };
    const seen = new Set();
    for (const h of houses) {
      const m = MARKETS.includes(h.market) ? h.market : s.market;
      seen.add(`${m}:${h.tab}`);
      const list = profiles[m];
      const idx = list.findIndex((x) => x.source?.sheetId === sheetId && x.source.tab === h.tab);
      const name = h.tab.slice(0, 60);
      if (idx >= 0) {
        profiles[m] = list.map((x, i) => (i === idx ? { ...x, name, inputs: houseFields(m, h.inputs) } : x));
      } else {
        profiles[m] = [...list, newProfile(m, name, h.inputs, { sheetId, tab: h.tab })];
      }
    }
    for (const m of MARKETS) {
      profiles[m] = profiles[m].map((x) =>
        x.source?.sheetId === sheetId && !seen.has(`${m}:${x.source.tab}`) ? { id: x.id, name: x.name, inputs: x.inputs } : x
      );
    }
    // Drop the untouched starter house when it was the only one and real
    // houses arrive in that market.
    for (const m of MARKETS) {
      const list = profiles[m];
      if (s.profiles[m].length === 1 && list.length > 1 && list[0] === s.profiles[m][0] && !list[0].source && isPristine(m, list[0])) {
        profiles[m] = list.slice(1);
      }
    }
    const active = { ...s.active };
    for (const m of MARKETS) if (!profiles[m].some((x) => x.id === active[m])) active[m] = profiles[m][0].id;
    const firstNew = houses.find((h) => (MARKETS.includes(h.market) ? h.market : s.market) === s.market);
    if (firstNew && !s.sources[sheetId]) {
      const p = profiles[s.market].find((x) => x.source?.sheetId === sheetId && x.source.tab === firstNew.tab);
      if (p) active[s.market] = p.id;
    }
    return { ...s, profiles, active, sources: { ...s.sources, [sheetId]: { url, market: s.sources[sheetId]?.market || s.market, lastSync: now } } };
  },
  unlinkSheet: (sheetId) => (s) => {
    const profiles = {};
    for (const m of MARKETS) profiles[m] = s.profiles[m].map((x) => (x.source?.sheetId === sheetId ? { id: x.id, name: x.name, inputs: x.inputs } : x));
    const sources = { ...s.sources };
    delete sources[sheetId];
    return { ...s, profiles, sources };
  },
  remove: (id) => (s) => {
    const list = s.profiles[s.market];
    if (list.length <= 1) return s;
    const next = list.filter((x) => x.id !== id);
    const active = s.active[s.market] === id ? next[0].id : s.active[s.market];
    return { ...mapProfiles(s, () => next), active: { ...s.active, [s.market]: active } };
  },
};

const isPristine = (m, profile) => JSON.stringify(profile.inputs) === JSON.stringify(houseFields(m));

// Clamp values that would break the model while the user is mid-typing.
export function sanitize(p) {
  return {
    ...p,
    horizon: Math.min(50, Math.max(1, Math.round(p.horizon) || 1)),
    amort: Math.min(40, Math.max(1, p.amort || 1)),
    downPct: Math.min(100, Math.max(0, p.downPct)),
  };
}

export function analyze(p, scenario = 'base') {
  const safe = sanitize(applyScenario(p, scenario));
  const rental = projectRental(safe);
  return {
    safe,
    rental,
    compare: compareRentalVsStocks(rental, safe),
    damming: safe.damming ? simulateCashDamming(rental, safe, safe.damming) : null,
  };
}

// Adds houses from an exported file next to the existing ones; never
// overwrites. Throws if the file has no profiles.
export function mergeImport(state, data) {
  if (!data?.profiles || typeof data.profiles !== 'object') throw new Error('No profiles in file');
  const incoming = normalize(data);
  const profiles = { ...state.profiles };
  for (const m of MARKETS) {
    if (!Array.isArray(data.profiles[m]) || !data.profiles[m].length) continue;
    const ids = new Set(state.profiles[m].map((x) => x.id));
    profiles[m] = [...state.profiles[m], ...incoming.profiles[m].map((x) => (ids.has(x.id) ? { ...x, id: uid() } : x))];
  }
  return { ...state, profiles, sources: { ...incoming.sources, ...state.sources } };
}

// The same house under every scenario, for side-by-side tables.
export const analyzeAll = (p) => Object.fromEntries(SCENARIOS.map((name) => [name, analyze(p, name)]));

// Tax cases: a named tax configuration that can change year by year.
//
//   steps     — [{ from, marginal, dividend }] rate changes from a given
//               year onward (year 1 uses the base `marginal` / `dividend`).
//   ccaSteps  — [{ from, claim }] whether CCA is claimed from a given year
//               onward (claimed from year 1 unless a step says otherwise).
//               Only applies to houses whose "Claim CCA" switch is on.
//
// Several cases can be saved per market and compared side by side.

import { DEFAULTS } from './defaults';

export const uid = () => Math.random().toString(36).slice(2, 10);

const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

// Sorted, de-duplicated, integer years >= 2 for rate steps.
export function cleanSteps(steps) {
  const map = new Map();
  for (const s of Array.isArray(steps) ? steps : []) {
    const from = Math.round(num(s?.from, 0));
    if (from < 2 || from > 60) continue;
    map.set(from, { from, marginal: num(s.marginal, 0), dividend: num(s.dividend, 0) });
  }
  return [...map.values()].sort((a, b) => a.from - b.from);
}

export function cleanCcaSteps(steps) {
  const map = new Map();
  for (const s of Array.isArray(steps) ? steps : []) {
    const from = Math.round(num(s?.from, 0));
    if (from < 1 || from > 60) continue;
    map.set(from, { from, claim: Boolean(s.claim) });
  }
  return [...map.values()].sort((a, b) => a.from - b.from);
}

const stepAt = (steps, year) => {
  let hit = null;
  for (const s of steps || []) if (s.from <= year) hit = s;
  return hit;
};

export const marginalAt = (tax, year) => stepAt(tax.steps, year)?.marginal ?? tax.marginal;
export const dividendAt = (tax, year) => stepAt(tax.steps, year)?.dividend ?? tax.dividend;
export const ccaClaimAt = (tax, year) => stepAt(tax.ccaSteps, year)?.claim ?? true;

// Fill a tax object from defaults; migrates the older dropYear/laterMarginal
// fields into a step.
export function normalizeTax(market, raw = {}) {
  const d = DEFAULTS[market].tax;
  const tax = { ...d };
  for (const k of Object.keys(d)) if (raw[k] !== undefined && raw[k] !== null) tax[k] = raw[k];
  let steps = cleanSteps(raw.steps);
  if (!steps.length && num(raw.dropYear) > 0) {
    steps = cleanSteps([{ from: raw.dropYear, marginal: num(raw.laterMarginal, d.marginal), dividend: num(raw.laterDividend, d.dividend) }]);
  }
  tax.steps = steps;
  tax.ccaSteps = cleanCcaSteps(raw.ccaSteps);
  delete tax.dropYear;
  delete tax.laterMarginal;
  delete tax.laterDividend;
  return tax;
}

export const newTaxCase = (market, name, tax) => ({ id: uid(), name: String(name).slice(0, 60), tax: normalizeTax(market, tax) });

// Seeded cases. SEED_VERSION bumps when a case is added so existing saves
// pick up the new one (by name) without touching the user's own cases.
export const SEED_VERSION = 2;
export function defaultTaxCases(market) {
  if (market !== 'CA') return [newTaxCase(market, 'Mặc định', {})];
  return [
    newTaxCase('CA', 'Top bracket throughout', {}),
    newTaxCase('CA', 'Lower from year 5', { steps: [{ from: 5, marginal: 35, dividend: 18 }] }),
    newTaxCase('CA', 'Lower from year 10', { steps: [{ from: 10, marginal: 35, dividend: 18 }] }),
    // Semi-retirement on ~$130k of consulting income from 2031 (year 5 of a
    // 2027 purchase), easing further from 2038. The sale is taxed by stacking
    // recapture and the gain on top of that income using BC brackets.
    newTaxCase('CA', 'Semi-retire 2031', {
      steps: [
        { from: 5, marginal: 38.5, dividend: 18 },
        { from: 12, marginal: 30, dividend: 10 },
      ],
      saleOtherIncome: 130000,
    }),
  ];
}

// Combined federal + BC marginal brackets (2025 thresholds, approximate).
// Used only to tax the sale year when `saleOtherIncome` is set, so a large
// recapture + capital gain is pushed up through the brackets instead of
// being taxed at a single flat rate.
export const BC_BRACKETS = [
  [0, 20.06],
  [49279, 22.7],
  [57375, 28.2],
  [98560, 31.0],
  [113158, 32.79],
  [114750, 38.29],
  [137407, 40.7],
  [177882, 43.7],
  [186306, 45.8],
  [253414, 49.8],
  [259829, 53.5],
];

const bracketTax = (income) => {
  let tax = 0;
  for (let i = 0; i < BC_BRACKETS.length; i++) {
    const [lo, rate] = BC_BRACKETS[i];
    const hi = BC_BRACKETS[i + 1]?.[0] ?? Infinity;
    if (income <= lo) break;
    tax += (Math.min(income, hi) - lo) * (rate / 100);
  }
  return tax;
};

// Tax on `extra` income stacked on top of `base` income.
export const stackedTax = (base, extra) => (extra <= 0 ? 0 : bracketTax(base + extra) - bracketTax(base));

// Short human summary, e.g. "53.5% · 35% from yr 5 · CCA from yr 3".
export function describeTax(tax, t) {
  const parts = [`${tax.marginal}%`];
  for (const s of tax.steps || []) parts.push(t.tcStep.replace('{m}', s.marginal).replace('{y}', s.from));
  if (tax.saleOtherIncome > 0) parts.push(t.tcSale.replace('{v}', `$${Math.round(tax.saleOtherIncome / 1000)}k`));
  const cca = tax.ccaSteps || [];
  if (cca.length) {
    const txt = cca.map((s) => (s.claim ? t.tcCcaOn : t.tcCcaOff).replace('{y}', s.from)).join(', ');
    parts.push(txt);
  }
  return parts.join(' · ');
}

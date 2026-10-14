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

export function defaultTaxCases(market) {
  if (market !== 'CA') return [newTaxCase(market, 'Mặc định', {})];
  return [
    newTaxCase('CA', 'Top bracket throughout', {}),
    newTaxCase('CA', 'Lower from year 5', { steps: [{ from: 5, marginal: 35, dividend: 18 }] }),
    newTaxCase('CA', 'Lower from year 10', { steps: [{ from: 10, marginal: 35, dividend: 18 }] }),
  ];
}

// Short human summary, e.g. "53.5% · 35% from yr 5 · CCA from yr 3".
export function describeTax(tax, t) {
  const parts = [`${tax.marginal}%`];
  for (const s of tax.steps || []) parts.push(t.tcStep.replace('{m}', s.marginal).replace('{y}', s.from));
  const cca = tax.ccaSteps || [];
  if (cca.length) {
    const txt = cca.map((s) => (s.claim ? t.tcCcaOn : t.tcCcaOff).replace('{y}', s.from)).join(', ');
    parts.push(txt);
  }
  return parts.join(' · ');
}

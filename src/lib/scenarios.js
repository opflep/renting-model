// Bear / base / bull cases. A scenario shifts a handful of assumptions by a
// number of percentage points on top of whatever each house already uses,
// so a house with 3% appreciation and a bear shift of -2 runs at 1%.

export const SCENARIOS = ['bear', 'base', 'bull'];
export const SCENARIO_FIELDS = ['appreciation', 'rentGrowth', 'vacancy', 'rate', 'stockReturn'];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function applyScenario(p, name) {
  const d = name === 'base' ? null : p.scenarios?.[name];
  if (!d) return p;
  const shift = (k) => Number(d[k]) || 0;
  return {
    ...p,
    appreciation: p.appreciation + shift('appreciation'),
    rentGrowth: p.rentGrowth + shift('rentGrowth'),
    vacancy: clamp(p.vacancy + shift('vacancy'), 0, 100),
    rate: Math.max(0, p.rate + shift('rate')),
    stocks: { ...p.stocks, stockReturn: p.stocks.stockReturn + shift('stockReturn') },
    // Your own home moves with the same market and rate environment.
    damming: p.damming && {
      ...p.damming,
      homeGrowth: p.damming.homeGrowth + shift('appreciation'),
      homeRate: Math.max(0, p.damming.homeRate + shift('rate')),
      helocRate: Math.max(0, p.damming.helocRate + shift('rate')),
    },
  };
}

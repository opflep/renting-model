// Bear / base / bull cases. A scenario shifts a handful of assumptions by a
// number of percentage points on top of whatever each house already uses,
// so a house with 3% appreciation and a bear shift of -2 runs at 1%.
// The rental and the stock market get their own scenario, so a bear housing
// market can be tested against a bull stock market and vice versa.

export const SCENARIOS = ['bear', 'base', 'bull'];
export const RENTAL_FIELDS = ['appreciation', 'rentGrowth', 'vacancy', 'rate'];
export const STOCK_FIELDS = ['stockReturn'];
export const SCENARIO_FIELDS = [...RENTAL_FIELDS, ...STOCK_FIELDS];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function applyScenario(p, rental = 'base', stocks = 'base') {
  const r = rental === 'base' ? null : p.scenarios?.[rental];
  const s = stocks === 'base' ? null : p.scenarios?.[stocks];
  if (!r && !s) return p;
  const shift = (k) => Number((STOCK_FIELDS.includes(k) ? s : r)?.[k]) || 0;
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

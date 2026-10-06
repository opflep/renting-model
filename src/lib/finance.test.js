import { describe, expect, it } from 'vitest';
import { DEFAULTS } from './defaults';
import { compareRentalVsStocks, irr, monthlyPayment, projectAccount, projectRental, projectWithRoom, simulateCashDamming } from './finance';

describe('mortgage math', () => {
  it('matches a known monthly-compounded payment', () => {
    expect(monthlyPayment(100000, 6, 30)).toBeCloseTo(599.55, 2);
  });

  it('semi-annual compounding is cheaper than monthly at the same nominal rate', () => {
    expect(monthlyPayment(500000, 5, 25, 'semiannual')).toBeLessThan(monthlyPayment(500000, 5, 25));
  });

  it('pays the loan off exactly at amortization', () => {
    const r = projectRental({ ...DEFAULTS.CA, horizon: 30 });
    expect(r.rows[29].loanBalance).toBe(0);
    expect(r.rows[28].loanBalance).toBeGreaterThan(0);
  });
});

describe('irr', () => {
  it('recovers a simple compound return', () => {
    expect(irr([-100, 0, 0, 133.1])).toBeCloseTo(10, 4);
  });
});

describe('investment accounts', () => {
  const s = { stockReturn: 7, dividendYield: 2, fee: 0, depositRate: 3 };
  const tax = { ...DEFAULTS.CA.tax, market: 'CA' };
  const flows = [1000, ...Array(10).fill(0)];

  it('TFSA compounds untaxed', () => {
    expect(projectAccount('tfsa', flows, s, tax).values[10]).toBeCloseTo(1000 * 1.07 ** 10, 4);
  });

  it('RRSP equals TFSA when tax rates now and later are equal', () => {
    const same = { ...tax, retirement: tax.marginal };
    expect(projectAccount('rrsp', flows, s, same).values[10]).toBeCloseTo(projectAccount('tfsa', flows, s, tax).values[10], 6);
  });

  it('non-registered trails TFSA', () => {
    expect(projectAccount('nonreg', flows, s, tax).values[10]).toBeLessThan(projectAccount('tfsa', flows, s, tax).values[10]);
  });
});

describe('rental vs stocks', () => {
  it('contributes the same cash to both sides', () => {
    const rental = projectRental(DEFAULTS.CA);
    const cmp = compareRentalVsStocks(rental, DEFAULTS.CA);
    const topUps = rental.rows.reduce((a, r) => a + Math.max(0, -r.cashflow), 0);
    expect(cmp.totalContributed).toBeCloseTo(rental.initialCash + topUps, 4);
    expect(cmp.series).toHaveLength(DEFAULTS.CA.horizon + 1);
  });

  it('works for Vietnam', () => {
    const rental = projectRental(DEFAULTS.VN);
    const cmp = compareRentalVsStocks(rental, DEFAULTS.VN);
    expect(Object.keys(cmp.accounts)).toEqual(['vnstock', 'deposit']);
    expect(rental.rows[0].taxBill).toBeCloseTo(15e6 * 12 * 0.95 * 0.1, 0);
  });
});

describe('cash damming', () => {
  it('pays the home off sooner and ends ahead', () => {
    const rental = projectRental(DEFAULTS.CA);
    const res = simulateCashDamming(rental, DEFAULTS.CA, DEFAULTS.CA.damming);
    expect(res.dam.payoffYear).toBeLessThan(res.base.payoffYear);
    expect(res.taxSaved).toBeGreaterThan(0);
    expect(res.netBenefit).toBeGreaterThan(0);
  });

  it('total debt is unchanged in the first month aside from tax effects', () => {
    const rental = projectRental({ ...DEFAULTS.CA, horizon: 1 });
    const res = simulateCashDamming(rental, DEFAULTS.CA, { ...DEFAULTS.CA.damming, capitalize: false });
    const y1 = res.series[1];
    // Debt converted, not created: difference in net position is small in year 1.
    expect(Math.abs(y1.damNet - y1.baseNet)).toBeLessThan(5000);
  });
});

describe('contribution room', () => {
  it('spills TFSA contributions above room into non-registered', () => {
    const s = { ...DEFAULTS.CA.stocks, tfsaRoom: 500 };
    const tax = { ...DEFAULTS.CA.tax, market: 'CA' };
    const res = projectWithRoom('tfsa', [1000, 0, 0], s, tax);
    expect(res.overflow).toBe(500);
    const tfsa = projectAccount('tfsa', [500, 0, 0], s, tax).values[2];
    const nonreg = projectAccount('nonreg', [500, 0, 0], s, tax).values[2];
    expect(res.values[2]).toBeCloseTo(tfsa + nonreg, 6);
  });
});

describe('scenarios', () => {
  it('shifts assumptions on top of the inputs and orders outcomes', async () => {
    const { applyScenario } = await import('./scenarios');
    const { analyzeAll } = await import('./store');
    const p = DEFAULTS.CA;
    const bear = applyScenario(p, 'bear', 'bear');
    expect(bear.appreciation).toBe(1);
    expect(bear.rate).toBe(6);
    expect(bear.stocks.stockReturn).toBe(5);
    expect(bear.damming.helocRate).toBeCloseTo(6.45, 6);
    expect(applyScenario(p, 'base', 'base')).toBe(p);
    expect(applyScenario({ ...p, vacancy: 0 }, 'bull').vacancy).toBe(0);

    // Rental and stock scenarios are independent.
    const mixed = applyScenario(p, 'bear', 'bull');
    expect(mixed.appreciation).toBe(1);
    expect(mixed.stocks.stockReturn).toBe(9);
    expect(applyScenario(p, 'base', 'bear').appreciation).toBe(3);
    expect(applyScenario(p, 'base', 'bear').stocks.stockReturn).toBe(5);

    const all = analyzeAll(p);
    const irr = (k) => all[k].compare.rental.irr;
    expect(irr('bear')).toBeLessThan(irr('base'));
    expect(irr('base')).toBeLessThan(irr('bull'));
  });
});

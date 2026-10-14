// Finds the CCA claim window (first year .. last year) that maximises the
// rental's after-tax IRR under a given tax case. A claim is worth the most
// when it is deducted at a high rate and recaptured at a lower one, so the
// best window usually covers the high-rate years and stops some years
// before the sale, where a late claim would be recaptured almost at once.

import { irr, projectRental } from './finance';
import { sanitize } from './store';
import { cleanCcaSteps } from './taxcases';

export const windowSteps = (from, to, horizon) => {
  if (from < 1 || to < from) return [{ from: 1, claim: false }];
  const steps = [];
  if (from > 1) steps.push({ from: 1, claim: false });
  steps.push({ from, claim: true });
  if (to < horizon) steps.push({ from: to + 1, claim: false });
  return cleanCcaSteps(steps);
};

function evaluate(p, ccaSteps) {
  const r = projectRental({ ...p, tax: { ...p.tax, ccaSteps } });
  const n = r.rows.length;
  const flows = [-r.initialCash, ...r.rows.map((row, i) => row.cashflow + (i === n - 1 ? row.netSaleProceeds : 0))];
  const cashIn = r.initialCash + r.rows.reduce((a, row) => a + Math.max(0, -row.cashflow), 0);
  const last = r.rows[n - 1];
  return {
    irr: irr(flows),
    profit: last.netSaleProceeds + r.rows.reduce((a, row) => a + Math.max(0, row.cashflow), 0) - cashIn,
    claimed: r.rows.reduce((a, row) => a + row.cca, 0),
    recaptureTax: last.recaptureTax,
    cashIn,
  };
}

// Returns { none, all, best: { from, to, steps, ...metrics } }.
export function bestCcaWindow(input, tax) {
  const p = sanitize({ ...input, claimCCA: true, tax });
  const n = p.horizon;
  const none = evaluate(p, [{ from: 1, claim: false }]);
  const all = evaluate(p, []);
  let best = { from: 1, to: n, steps: [], ...all };
  for (let from = 1; from <= n; from++) {
    for (let to = from; to <= n; to++) {
      const steps = windowSteps(from, to, n);
      const m = evaluate(p, steps);
      if (m.irr != null && (best.irr == null || m.irr > best.irr + 1e-9)) best = { from, to, steps, ...m };
    }
  }
  if (none.irr != null && (best.irr == null || none.irr >= best.irr)) best = { from: 0, to: 0, steps: [{ from: 1, claim: false }], ...none };
  return { none, all, best };
}

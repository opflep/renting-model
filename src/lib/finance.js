// Pure financial engine. No React here so it can be unit-tested.
// All amounts are in the market's base currency unit ($1 or 1 VND).
// Rates are passed as percentages (e.g. 4.5 for 4.5%) unless noted.

const pct = (v) => (Number(v) || 0) / 100;

// ---------------------------------------------------------------------------
// Mortgages
// ---------------------------------------------------------------------------

// Effective monthly rate. Canadian fixed mortgages compound semi-annually by
// law (Interest Act); most other loans and HELOCs compound monthly.
export function monthlyRate(annualPct, compounding = 'monthly') {
  const r = pct(annualPct);
  if (compounding === 'semiannual') return Math.pow(1 + r / 2, 1 / 6) - 1;
  return r / 12;
}

export function monthlyPayment(principal, annualPct, years, compounding = 'monthly') {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = monthlyRate(annualPct, compounding);
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

// ---------------------------------------------------------------------------
// Tax rules
// ---------------------------------------------------------------------------

// Canada: net rental income (rent - expenses - interest - CCA) is added to
// income and taxed at the marginal rate. A rental loss offsets other income
// (employment etc.) so it produces a refund when `lossOffset` is on.
// Vietnam: individuals renting out property pay 5% VAT + 5% PIT on GROSS rent
// when annual rent exceeds 100M VND. Expenses and interest are not deductible.
export function rentalIncomeTax({ market, grossRent, netIncome, tax }) {
  if (market === 'VN') {
    return grossRent > tax.vnRentalThreshold ? grossRent * pct(tax.vnRentalRate) : 0;
  }
  if (netIncome < 0 && !tax.lossOffset) return 0;
  return netIncome * pct(tax.marginal);
}

// ---------------------------------------------------------------------------
// Rental property projection
// ---------------------------------------------------------------------------

export function projectRental(p) {
  const isVN = p.market === 'VN';
  const compounding = isVN ? 'monthly' : 'semiannual';
  const downPayment = p.price * pct(p.downPct);
  const closingCosts = p.price * pct(p.closingPct);
  const loanAmount = p.price - downPayment;
  const payment = monthlyPayment(loanAmount, p.rate, p.amort, compounding);
  const mRate = monthlyRate(p.rate, compounding);

  // CCA (Canada only): Class 1 building, 4% declining balance, half-year rule
  // in year 1. CCA can't create or increase a rental loss.
  const buildingCost = isVN ? 0 : (p.price + closingCosts) * pct(p.buildingPct);
  let ucc = buildingCost;

  let balance = loanAmount;
  let value = p.price;
  let rent = p.rent;
  let propTax = p.propTax;
  let insurance = p.insurance;
  let strata = p.strata;
  let other = p.other;

  const rows = [];
  for (let year = 1; year <= p.horizon; year++) {
    let interest = 0;
    let principal = 0;
    for (let m = 0; m < 12 && balance > 0.005; m++) {
      const i = balance * mRate;
      const pr = Math.min(payment - i, balance);
      interest += i;
      principal += pr;
      balance -= pr;
    }
    if (balance < 0.005) balance = 0;

    const grossRent = rent * 12 * (1 - pct(p.vacancy));
    const opex = strata * 12 + propTax + insurance + other * 12;
    const debtService = interest + principal;
    const cashflowPreTax = grossRent - opex - debtService;

    const netBeforeCCA = grossRent - opex - interest;
    let cca = 0;
    if (!isVN && p.claimCCA) {
      const maxClaim = ucc * pct(p.ccaRate) * (year === 1 ? 0.5 : 1);
      cca = Math.max(0, Math.min(maxClaim, netBeforeCCA));
      ucc -= cca;
    }
    const taxableIncome = netBeforeCCA - cca;
    const taxBill = rentalIncomeTax({ market: p.market, grossRent, netIncome: taxableIncome, tax: p.tax });
    const cashflow = cashflowPreTax - taxBill;

    const startValue = value;
    value *= 1 + pct(p.appreciation);
    const appreciation = value - startValue;

    const sale = saleOutcome({ p, value, balance, closingCosts, buildingCost, ucc, isVN });

    rows.push({
      year,
      propertyValue: value,
      loanBalance: balance,
      equity: value - balance,
      grossRent,
      operatingExpenses: opex,
      interest,
      principal,
      mortgagePayment: debtService,
      cashflowPreTax,
      taxableIncome,
      cca,
      taxBill,
      cashflow,
      appreciation,
      totalGain: cashflow + principal + appreciation,
      ...sale,
      breakdown: { strata: strata * 12, propTax, insurance, other: other * 12, interest, incomeTax: Math.max(0, taxBill) },
    });

    rent *= 1 + pct(p.rentGrowth);
    propTax *= 1 + pct(p.expInflation);
    insurance *= 1 + pct(p.expInflation);
    strata *= 1 + pct(p.expInflation);
    other *= 1 + pct(p.expInflation);
  }

  return {
    payment,
    loanAmount,
    downPayment,
    closingCosts,
    initialCash: downPayment + closingCosts,
    rows,
  };
}

// What you'd walk away with if you sold at the end of this year, after
// selling costs, paying off the loan and settling all taxes due on sale.
function saleOutcome({ p, value, balance, closingCosts, buildingCost, ucc, isVN }) {
  const sellingCosts = value * pct(p.sellingPct);
  let capitalGainsTax = 0;
  let recaptureTax = 0;
  let capitalGain = 0;
  if (isVN) {
    // Transfer PIT: flat 2% of the sale price, regardless of gain.
    capitalGainsTax = value * pct(p.tax.vnSaleRate);
  } else {
    const acb = p.price + closingCosts;
    capitalGain = value - sellingCosts - acb;
    capitalGainsTax = Math.max(0, capitalGain) * pct(p.tax.cgInclusion) * pct(p.tax.marginal);
    if (p.claimCCA && buildingCost > 0) {
      // Recapture (or terminal loss if negative) is fully taxable income.
      const buildingProceeds = Math.min(buildingCost, (value - sellingCosts) * pct(p.buildingPct));
      recaptureTax = (buildingProceeds - ucc) * pct(p.tax.marginal);
    }
  }
  const netSaleProceeds = value - sellingCosts - balance - capitalGainsTax - recaptureTax;
  return { sellingCosts, capitalGain, capitalGainsTax, recaptureTax, netSaleProceeds };
}

// ---------------------------------------------------------------------------
// Investment accounts
// ---------------------------------------------------------------------------

export const ACCOUNTS = {
  CA: ['nonreg', 'tfsa', 'rrsp', 'deposit'],
  VN: ['vnstock', 'deposit'],
};

// contributions[t] is invested at the end of year t (t = 0 is today).
// Returns { values[t]: after-tax value if liquidated at end of year t,
//           gross[t], taxPaid (cumulative drag), contributed }.
export function projectAccount(kind, contributions, s, tax) {
  const r = pct(s.stockReturn) - pct(s.fee);
  const y = pct(s.dividendYield);
  const marginal = pct(tax.marginal);
  let V = 0;
  let acb = 0;
  let annualTax = 0;
  const values = [];
  const gross = [];

  for (let t = 0; t < contributions.length; t++) {
    if (t > 0) {
      if (kind === 'nonreg') {
        // Dividends taxed yearly at the dividend rate; growth deferred until sale.
        const div = V * y;
        const divTax = div * pct(tax.dividend);
        V = V * (1 + r - y) + div - divTax;
        acb += div - divTax;
        annualTax += divTax;
      } else if (kind === 'vnstock') {
        // VN: 5% withholding on cash dividends; gains untaxed except 0.1% on sale.
        const div = V * y;
        const divTax = div * pct(tax.vnDividend);
        V = V * (1 + r - y) + div - divTax;
        annualTax += divTax;
      } else if (kind === 'deposit') {
        const interest = V * pct(s.depositRate);
        // Canada: interest taxed as ordinary income. VN: bank interest is PIT-exempt.
        const iTax = tax.market === 'VN' ? 0 : interest * marginal;
        V += interest - iTax;
        annualTax += iTax;
      } else {
        V *= 1 + r; // TFSA / RRSP: sheltered
      }
    }
    const c = contributions[t] || 0;
    // RRSP: the contribution earns a refund at today's marginal rate, which is
    // also contributed (gross-up), so $1 after-tax buys 1/(1-t) inside the plan.
    const added = kind === 'rrsp' ? c / (1 - marginal) : c;
    V += added;
    acb += added;
    gross.push(V);

    let liq = V;
    if (kind === 'nonreg') liq = V - Math.max(0, V - acb) * pct(tax.cgInclusion) * marginal;
    if (kind === 'vnstock') liq = V * (1 - pct(tax.vnSale));
    if (kind === 'rrsp') liq = V * (1 - pct(tax.retirement));
    values.push(liq);
  }

  const contributed = contributions.reduce((a, b) => a + (b || 0), 0);
  return { values, gross, annualTax, contributed };
}

// ---------------------------------------------------------------------------
// Rental vs stocks — equal-cash comparison
// ---------------------------------------------------------------------------
// The stock investor puts in exactly what the landlord puts in: the down
// payment + closing costs on day one, plus any year the rental needs a top-up
// (negative after-tax cashflow). When the rental throws off surplus cash, the
// landlord invests it in a taxable side account, so both sides end with all
// money working.

export function compareRentalVsStocks(rental, p) {
  const { rows, initialCash } = rental;
  const horizon = rows.length;
  const contributions = [initialCash];
  const surplus = [0];
  for (const row of rows) {
    contributions.push(row.cashflow < 0 ? -row.cashflow : 0);
    surplus.push(row.cashflow > 0 ? row.cashflow : 0);
  }

  const taxCtx = { ...p.tax, market: p.market };
  const sideKind = p.market === 'VN' ? 'vnstock' : 'nonreg';
  const side = projectAccount(sideKind, surplus, p.stocks, taxCtx);

  const rentalWealth = [initialCash];
  for (let t = 1; t <= horizon; t++) {
    rentalWealth.push(rows[t - 1].netSaleProceeds + side.values[t]);
  }
  const rentalFlows = [-initialCash, ...rows.map((r, i) => r.cashflow + (i === horizon - 1 ? r.netSaleProceeds : 0))];

  const accounts = {};
  for (const kind of ACCOUNTS[p.market]) {
    const acct = projectWithRoom(kind, contributions, p.stocks, taxCtx);
    const flows = contributions.map((c, t) => -c + (t === horizon ? acct.values[t] : 0));
    accounts[kind] = { ...acct, irr: irr(flows) };
  }

  const breakEven = breakEvenReturn(rentalWealth[horizon], (ret) =>
    projectAccount(sideKind, contributions, { ...p.stocks, stockReturn: ret }, taxCtx).values[horizon]
  );

  const series = rentalWealth.map((w, t) => {
    const point = { year: t, rental: w, contributed: contributions.slice(0, t + 1).reduce((a, b) => a + b, 0) };
    for (const kind of Object.keys(accounts)) point[kind] = accounts[kind].values[t];
    return point;
  });

  return {
    contributions,
    totalContributed: contributions.reduce((a, b) => a + b, 0),
    rental: { wealth: rentalWealth, irr: irr(rentalFlows), sideAccount: side.values[horizon] },
    accounts,
    breakEven,
    series,
  };
}

// TFSA / RRSP contributions are capped by available room; anything beyond it
// overflows into a non-registered account. RRSP room is consumed by the
// grossed-up contribution.
export function projectWithRoom(kind, contributions, s, tax) {
  const roomKey = { tfsa: 'tfsaRoom', rrsp: 'rrspRoom' }[kind];
  if (!roomKey) return { ...projectAccount(kind, contributions, s, tax), overflow: 0 };
  const gross = kind === 'rrsp' ? 1 / (1 - pct(tax.marginal)) : 1;
  let room = Math.max(0, s[roomKey] || 0);
  const sheltered = [];
  const spill = [];
  for (const c of contributions) {
    const fits = Math.min(c, room / gross);
    room -= fits * gross;
    sheltered.push(fits);
    spill.push(c - fits);
  }
  const a = projectAccount(kind, sheltered, s, tax);
  const b = projectAccount('nonreg', spill, s, tax);
  return {
    values: a.values.map((v, t) => v + b.values[t]),
    gross: a.gross.map((v, t) => v + b.gross[t]),
    annualTax: a.annualTax + b.annualTax,
    contributed: a.contributed + b.contributed,
    overflow: b.contributed,
  };
}

// Stock return (in %) at which the stock path ends level with the rental.
function breakEvenReturn(target, valueAt) {
  let lo = -20;
  let hi = 40;
  if (valueAt(hi) < target || valueAt(lo) > target) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (valueAt(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Annual IRR in % by bisection. Returns null when no sign change exists.
export function irr(flows) {
  const npv = (r) => flows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
  let lo = -0.99;
  let hi = 1;
  let fLo = npv(lo);
  const fHi = npv(hi);
  if (!isFinite(fLo) || fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const f = npv(mid);
    if (Math.abs(f) < 1e-7) return mid * 100;
    if (f * fLo < 0) hi = mid;
    else {
      lo = mid;
      fLo = f;
    }
  }
  return ((lo + hi) / 2) * 100;
}

// ---------------------------------------------------------------------------
// Cash damming (Canada)
// ---------------------------------------------------------------------------
// Two households, identical except for how rental money is routed:
//
//   Baseline — rent pays rental expenses; leftover (after tax) is swept onto
//              the home mortgage once a year; shortfalls come out of pocket.
//   Damming  — every dollar of rent prepays the (non-deductible) home mortgage;
//              every rental expense is paid by a HELOC drawn from the
//              re-advanceable home loan. HELOC interest is deductible against
//              rental income and can be capitalized while damming.
//
// Both households make the same regular home-mortgage payment from salary.
// Once a home mortgage is gone, the freed-up payment is saved. Cash balances
// accrue at the home-mortgage rate (the opportunity cost of not prepaying).
// Net position = cash - home mortgage - HELOC. The rental itself is identical
// in both cases, so it nets out.

export function simulateCashDamming(rental, p, d) {
  const rows = rental.rows;
  const marginal = pct(p.tax.marginal);
  const personalPayment = monthlyPayment(d.homeBalance, d.homeRate, d.homeAmort, 'semiannual');
  const homeR = monthlyRate(d.homeRate, 'semiannual');
  const helocR = monthlyRate(d.helocRate, 'monthly');
  const cashR = homeR;

  const base = { bal: d.homeBalance, cash: 0, interestPaid: 0, payoffYear: null };
  const dam = { bal: d.homeBalance, heloc: 0, cash: 0, interestPaid: 0, payoffYear: null, helocInterestPaid: 0 };
  let homeValue = d.homeValue;
  let cumulativeTaxSaved = 0;

  const series = [{
    year: 0,
    baseHome: base.bal,
    damHome: dam.bal,
    damHeloc: 0,
    baseNet: -base.bal,
    damNet: -dam.bal,
    taxSaved: 0,
    deductibleShare: 0,
  }];

  for (let year = 1; year <= rows.length; year++) {
    const row = rows[year - 1];
    const rentM = row.grossRent / 12;
    const expM = (row.operatingExpenses + row.mortgagePayment) / 12;
    let helocInterestYear = 0;

    for (let m = 0; m < 12; m++) {
      // --- Baseline ---------------------------------------------------------
      base.cash *= 1 + cashR;
      payHome(base, personalPayment, homeR);
      base.cash += rentM - expM;

      // --- Damming ----------------------------------------------------------
      dam.cash *= 1 + cashR;
      payHome(dam, personalPayment, homeR);
      const damming = dam.bal > 0;
      const room = () =>
        Math.max(0, Math.min(homeValue * pct(d.helocLTV), homeValue * pct(d.totalLTV) - dam.bal) - dam.heloc);

      if (damming) {
        const prepay = Math.min(rentM, dam.bal);
        dam.bal -= prepay;
        dam.cash += rentM - prepay;
        const draw = Math.min(expM, room());
        dam.heloc += draw;
        dam.cash -= expM - draw;
      } else {
        dam.cash += rentM - expM;
      }

      const hInt = dam.heloc * helocR;
      helocInterestYear += hInt;
      dam.helocInterestPaid += hInt;
      const capitalize = d.capitalize && damming ? Math.min(hInt, room()) : 0;
      dam.heloc += capitalize;
      dam.cash -= hInt - capitalize;
    }

    // --- Year-end tax settlement & sweep -----------------------------------
    const baseTax = row.taxBill;
    const damTaxable = row.taxableIncome - helocInterestYear;
    const damTax = damTaxable < 0 && !p.tax.lossOffset ? 0 : damTaxable * marginal;
    cumulativeTaxSaved += baseTax - damTax;
    base.cash -= baseTax;
    dam.cash -= damTax;
    sweep(base);
    sweep(dam);
    if (base.bal <= 0 && base.payoffYear === null) base.payoffYear = year;
    if (dam.bal <= 0 && dam.payoffYear === null) dam.payoffYear = year;

    homeValue *= 1 + pct(d.homeGrowth);
    const totalDebt = dam.bal + dam.heloc;
    series.push({
      year,
      baseHome: base.bal,
      damHome: dam.bal,
      damHeloc: dam.heloc,
      baseCash: base.cash,
      damCash: dam.cash,
      baseNet: base.cash - base.bal,
      damNet: dam.cash - dam.bal - dam.heloc,
      taxSaved: cumulativeTaxSaved,
      deductibleShare: totalDebt > 0 ? (dam.heloc / totalDebt) * 100 : 100,
    });
  }

  const last = series[series.length - 1];
  return {
    personalPayment,
    series,
    base,
    dam,
    taxSaved: cumulativeTaxSaved,
    netBenefit: last.damNet - last.baseNet,
    yearsSaved: (base.payoffYear ?? Infinity) - (dam.payoffYear ?? Infinity),
  };

  function payHome(h, pmt, r) {
    if (h.bal > 0) {
      const i = h.bal * r;
      h.interestPaid += i;
      const pr = Math.min(pmt - i, h.bal);
      h.bal -= pr;
      // Unused part of the final payment stays with the household.
      h.cash += pmt - i - pr;
    } else {
      h.cash += pmt; // mortgage-free: the regular payment is saved instead
    }
  }

  function sweep(h) {
    if (h.cash > 0 && h.bal > 0) {
      const amt = Math.min(h.cash, h.bal);
      h.bal -= amt;
      h.cash -= amt;
    }
  }
}

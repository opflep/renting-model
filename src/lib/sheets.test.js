import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildTemplate, matchField, normLabel, parseHouseRows, parseSheetUrl, parseValue, parseWorkbook } from './sheets';
import { DEFAULTS } from './defaults';
import { actions, initialState } from './store';

describe('sheet links', () => {
  it('extracts the spreadsheet id from links and bare ids', () => {
    const id = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    expect(parseSheetUrl(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`)).toBe(id);
    expect(parseSheetUrl(`https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`)).toBe(id);
    expect(parseSheetUrl(id)).toBe(id);
    expect(parseSheetUrl('https://example.com/whatever')).toBeNull();
  });
});

describe('label matching', () => {
  it('ignores case, accents, units and punctuation', () => {
    expect(normLabel('Down payment (%)')).toBe('down payment');
    expect(matchField('Purchase Price ($)')).toBe('price');
    expect(matchField('Property tax / yr')).toBe('propTax');
    expect(matchField('Strata / mo')).toBe('strata');
    expect(matchField('Giá thuê / tháng')).toBe('rent');
    expect(matchField('Lãi suất vay (%)')).toBe('rate');
    expect(matchField('Favourite colour')).toBeNull();
  });
});

describe('value parsing', () => {
  it('handles currency, suffixes, locales and percent cells', () => {
    expect(parseValue('price', '$530,000')).toBe(530000);
    expect(parseValue('price', '4 tỷ')).toBe(4e9);
    expect(parseValue('price', '4.000.000.000')).toBe(4e9);
    expect(parseValue('rent', '15tr')).toBe(15e6);
    expect(parseValue('rent', '2.4k')).toBe(2400);
    expect(parseValue('rate', '4,5')).toBe(4.5);
    expect(parseValue('rate', '4.5%')).toBe(4.5);
    expect(parseValue('downPct', 0.25, '25%')).toBe(25);
    expect(parseValue('downPct', 25, '25')).toBe(25);
    expect(parseValue('claimCCA', 'Yes')).toBe(true);
    expect(parseValue('market', 'Việt Nam')).toBe('VN');
    expect(parseValue('price', 'n/a')).toBeUndefined();
  });

  it('parses one tab of label/value rows', () => {
    const h = parseHouseRows([['Field', 'Value'], ['Market', 'VN'], ['Purchase price', '5 tỷ'], ['Monthly rent', '18tr'], ['Pets', 'yes']], 'CA');
    expect(h.market).toBe('VN');
    expect(h.inputs).toEqual({ price: 5e9, rent: 18e6 });
    expect(h.unknown).toEqual(['Field', 'Pets']);
  });
});

const book = (tabs) => {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(tabs)) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
};

describe('workbook import', () => {

  it('turns each house-like tab into a house and skips the rest', async () => {
    const buf = book({
      README: [['notes'], ['Purchase price', 1], ['Monthly rent', 2]],
      'Main St': [['Purchase price', 600000], ['Monthly rent', 2600], ['Down payment (%)', 20]],
      Notes: [['hello', 'world']],
    });
    const { houses } = await parseWorkbook(buf, 'CA');
    expect(houses.map((h) => h.tab)).toEqual(['Main St']);
    expect(houses[0].inputs).toMatchObject({ price: 600000, rent: 2600, downPct: 20 });
  });
});

describe('template', () => {
  for (const m of ['CA', 'VN']) {
    it(`round-trips the ${m} template`, async () => {
      const buf = XLSX.write(buildTemplate(XLSX, m), { type: 'array', bookType: 'xlsx' });
      const { houses, taxCases } = await parseWorkbook(buf, m === 'CA' ? 'VN' : 'CA');
      expect(houses).toHaveLength(2);
      expect(taxCases).toHaveLength(m === 'CA' ? 5 : 0);
      expect(houses[0].market).toBe(m);
      const skip = new Set(['market', 'tax', 'stocks', 'damming', 'scenarios', 'ccaRate', ...(m === 'VN' ? ['claimCCA', 'buildingPct'] : [])]);
      const expected = Object.fromEntries(Object.entries(DEFAULTS[m]).filter(([k]) => !skip.has(k)));
      expect(houses[0].inputs).toEqual(expected);
    });
  }
});

describe('sheet sync', () => {
  const houses = [
    { tab: 'A', market: 'CA', inputs: { price: 500000, rent: 2000 } },
    { tab: 'B', market: 'CA', inputs: { price: 700000, rent: 3000 } },
  ];

  it('adds houses, replaces the untouched starter house, then updates in place', () => {
    let s = initialState();
    s = actions.applySheet('sheet1', 'url', houses, [], 1)(s);
    expect(s.profiles.CA.map((x) => x.name)).toEqual(['A', 'B']);
    expect(s.profiles.CA[0].source).toEqual({ sheetId: 'sheet1', tab: 'A' });
    const idA = s.profiles.CA[0].id;

    s = actions.set('price', 1)(actions.select(idA)(s));
    s = actions.applySheet('sheet1', 'url', [{ ...houses[0], inputs: { price: 550000 } }], [], 2)(s);
    const a = s.profiles.CA.find((x) => x.id === idA);
    expect(a.inputs.price).toBe(550000);
    expect(a.inputs.rent).toBe(2400); // missing in sheet -> default
    const b = s.profiles.CA.find((x) => x.name === 'B');
    expect(b.source).toBeUndefined(); // tab removed -> kept, unlinked
    expect(s.sources.sheet1.lastSync).toBe(2);
  });

  it('keeps an untouched house when the user already has several', () => {
    let s = actions.add('Second')(initialState());
    s = actions.applySheet('sheet1', 'url', houses)(s);
    expect(s.profiles.CA).toHaveLength(4);
  });

  it('keeps a starter house the user has edited', () => {
    let s = actions.set('price', 1)(initialState());
    s = actions.applySheet('sheet1', 'url', houses)(s);
    expect(s.profiles.CA).toHaveLength(3);
  });

  it('unlinking keeps houses as local copies', () => {
    let s = actions.applySheet('sheet1', 'url', houses)(initialState());
    s = actions.unlinkSheet('sheet1')(s);
    expect(s.sources).toEqual({});
    expect(s.profiles.CA.every((x) => !x.source)).toBe(true);
    expect(s.profiles.CA).toHaveLength(2);
  });
});

describe('tax cases tab', () => {
  it('parses step strings', async () => {
    const { parseRateSteps, parseCcaSteps } = await import('./sheets');
    expect(parseRateSteps('5: 38.5/18; 12: 30/10')).toEqual([{ from: 5, marginal: 38.5, dividend: 18 }, { from: 12, marginal: 30, dividend: 10 }]);
    expect(parseRateSteps('8 = 40%')).toEqual([{ from: 8, marginal: 40, dividend: 18.8 }]);
    expect(parseRateSteps('')).toEqual([]);
    expect(parseCcaSteps('1: no; 3: yes')).toEqual([{ from: 1, claim: false }, { from: 3, claim: true }]);
    expect(parseCcaSteps('2: Không')).toEqual([{ from: 2, claim: false }]);
  });

  it('reads a Tax cases tab and syncs it into the store', async () => {
    const buf = book({
      'Main St': [['Purchase price', 600000], ['Monthly rent', 2600]],
      'Tax cases': [
        ['Name', 'Market', 'Marginal %', 'Dividend %', 'Rate steps', 'CCA steps', 'Other income in sale year'],
        ['Sheet case A', 'CA', 50, 30, '6: 35/15', '1: no; 4: yes', 120000],
        ['Sheet case B', 'CA', '45%', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['Rate steps: "from year: marginal/dividend" — this is a note, not a case', '', '', '', '', '', ''],
      ],
    });
    const { houses, taxCases } = await parseWorkbook(buf, 'CA');
    expect(houses).toHaveLength(1);
    expect(taxCases).toHaveLength(2);
    expect(taxCases[0].tax).toMatchObject({ marginal: 50, dividend: 30, saleOtherIncome: 120000, steps: [{ from: 6, marginal: 35, dividend: 15 }], ccaSteps: [{ from: 1, claim: false }, { from: 4, claim: true }] });
    expect(taxCases[1].tax.marginal).toBe(45);

    let s = actions.applySheet('sheet1', 'url', houses, taxCases)(initialState());
    const names = s.shared.CA.taxCases.map((c) => c.name);
    expect(names).toContain('Sheet case A');
    const a = s.shared.CA.taxCases.find((c) => c.name === 'Sheet case A');
    expect(a.source).toEqual({ sheetId: 'sheet1', name: 'Sheet case A' });
    expect(a.tax.steps[0].from).toBe(6);
    // Re-sync updates in place; dropped row unlinks.
    s = actions.applySheet('sheet1', 'url', houses, [{ ...taxCases[0], tax: { ...taxCases[0].tax, marginal: 51 } }])(s);
    expect(s.shared.CA.taxCases.find((c) => c.name === 'Sheet case A').tax.marginal).toBe(51);
    expect(s.shared.CA.taxCases.find((c) => c.name === 'Sheet case B').source).toBeUndefined();
    s = actions.unlinkSheet('sheet1')(s);
    expect(s.shared.CA.taxCases.every((c) => !c.source)).toBe(true);
  });
});

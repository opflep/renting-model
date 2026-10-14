import { describe, expect, it } from 'vitest';
import { actions, activeProfile, activeTax, initialState, inputsFor, mergeImport, normalize } from './store';

describe('house profiles', () => {
  it('starts with one house per market', () => {
    const s = initialState();
    expect(s.profiles.CA).toHaveLength(1);
    expect(s.profiles.VN).toHaveLength(1);
    expect(activeProfile(s).name).toBe('House 1');
  });

  it('house edits stay on that house; tax edits are shared', () => {
    let s = initialState();
    s = actions.add('Condo B')(s);
    s = actions.set('price', 999000)(s);
    s = actions.set('tax.marginal', 40)(s);
    const [a, b] = s.profiles.CA;
    expect(a.inputs.price).toBe(530000);
    expect(b.inputs.price).toBe(999000);
    expect(inputsFor('CA', a, s.shared.CA).tax.marginal).toBe(40);
    expect(inputsFor('CA', b, s.shared.CA).tax.marginal).toBe(40);
  });

  it('duplicates, renames and deletes but never removes the last house', () => {
    let s = initialState();
    s = actions.add('Copy', { ...activeProfile(s).inputs, rent: 3000 })(s);
    expect(activeProfile(s).inputs.rent).toBe(3000);
    s = actions.rename(activeProfile(s).id, 'Renamed')(s);
    expect(activeProfile(s).name).toBe('Renamed');
    s = actions.remove(activeProfile(s).id)(s);
    expect(s.profiles.CA).toHaveLength(1);
    expect(actions.remove(s.profiles.CA[0].id)(s).profiles.CA).toHaveLength(1);
  });

  it('normalizes junk and fills new fields from defaults', () => {
    const s = normalize({ market: 'XX', profiles: { CA: [{ id: 'a', name: 'Old', inputs: { price: 1 } }] }, active: { CA: 'zzz' } });
    expect(s.market).toBe('CA');
    expect(s.profiles.CA[0].inputs.price).toBe(1);
    expect(s.profiles.CA[0].inputs.horizon).toBe(25);
    expect(s.active.CA).toBe('a');
    expect(normalize('garbage').profiles.CA).toHaveLength(1);
  });

  it('import appends houses and never overwrites', () => {
    const s = initialState();
    const merged = mergeImport(s, s);
    expect(merged.profiles.CA).toHaveLength(2);
    expect(new Set(merged.profiles.CA.map((x) => x.id)).size).toBe(2);
    expect(() => mergeImport(s, { nope: 1 })).toThrow();
  });
});

describe('tax cases', () => {
  it('seeds three Canadian cases and routes tax edits to the active one', () => {
    let s = initialState();
    expect(s.shared.CA.taxCases.map((c) => c.name)).toEqual(['Top bracket throughout', 'Lower from year 5', 'Lower from year 10']);
    const [a, b] = s.shared.CA.taxCases;
    s = actions.set('tax.marginal', 40)(s);
    expect(activeTax(s.shared.CA).marginal).toBe(40);
    s = actions.taxSelect(b.id)(s);
    expect(activeTax(s.shared.CA).marginal).toBe(53.5);
    expect(activeTax(s.shared.CA).steps).toEqual([{ from: 5, marginal: 35, dividend: 18 }]);
    expect(inputsFor('CA', activeProfile(s), s.shared.CA).tax.steps[0].from).toBe(5);
    expect(inputsFor('CA', activeProfile(s), s.shared.CA).taxCases).toBeUndefined();
    s = actions.taxAdd('Mine', { steps: [{ from: 3, marginal: 30, dividend: 10 }], ccaSteps: [{ from: 2, claim: false }] })(s);
    expect(s.shared.CA.taxCases).toHaveLength(4);
    expect(activeTax(s.shared.CA).ccaSteps).toEqual([{ from: 2, claim: false }]);
    s = actions.taxRename(s.shared.CA.activeTaxCase, 'Renamed')(s);
    expect(s.shared.CA.taxCases.at(-1).name).toBe('Renamed');
    s = actions.taxRemove(s.shared.CA.activeTaxCase)(s);
    expect(s.shared.CA.taxCases).toHaveLength(3);
    expect(s.shared.CA.activeTaxCase).toBe(a.id);
  });

  it('migrates an old single tax object with dropYear into a case with a step', () => {
    const s = normalize({ shared: { CA: { tax: { marginal: 50, dropYear: 7, laterMarginal: 30, laterDividend: 12 } } } });
    const tax = activeTax(s.shared.CA);
    expect(tax.marginal).toBe(50);
    expect(tax.steps).toEqual([{ from: 7, marginal: 30, dividend: 12 }]);
    expect(tax.dropYear).toBeUndefined();
  });
});

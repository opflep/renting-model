import { describe, expect, it } from 'vitest';
import { actions, activeProfile, initialState, inputsFor, mergeImport, normalize } from './store';

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

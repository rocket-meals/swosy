import { changesToAttributeObject, computeAttributeChanges, formatChanges, slugifyDisplayName } from './store-metadata-diff';

describe('computeAttributeChanges', () => {
  it('reports only fields that differ', () => {
    const desired = { a: 'NONE', b: false, c: 'FREQUENT_OR_INTENSE' };
    const current = { a: 'NONE', b: true, c: 'NONE', ignored: 'stays' };
    expect(computeAttributeChanges(desired, current)).toEqual([
      { key: 'b', from: true, to: false },
      { key: 'c', from: 'NONE', to: 'FREQUENT_OR_INTENSE' },
    ]);
  });

  it('ignores fields that are undefined in the ground truth', () => {
    expect(computeAttributeChanges({ a: undefined, b: 'x' }, { a: 'store-value', b: 'x' })).toEqual([]);
  });

  it('treats missing current values as change', () => {
    expect(computeAttributeChanges({ a: 'NONE' }, {})).toEqual([{ key: 'a', from: undefined, to: 'NONE' }]);
  });

  it('treats null and undefined as equal (Apple reports unanswered questions as null)', () => {
    expect(computeAttributeChanges({ kidsAgeBand: null }, {})).toEqual([]);
  });
});

describe('changesToAttributeObject', () => {
  it('builds a patch object from changes', () => {
    const changes = computeAttributeChanges({ a: 'NONE', b: false }, { a: 'FREQUENT_OR_INTENSE', b: true });
    expect(changesToAttributeObject(changes)).toEqual({ a: 'NONE', b: false });
  });
});

describe('formatChanges', () => {
  it('formats human readable lines', () => {
    const changes = computeAttributeChanges({ gambling: false }, { gambling: true });
    expect(formatChanges(changes, '')).toBe('gambling: true -> false');
  });
});

describe('slugifyDisplayName', () => {
  it('creates safe file names', () => {
    expect(slugifyDisplayName('Studi|Futter')).toBe('studi-futter');
    expect(slugifyDisplayName('SWOSY 2.0')).toBe('swosy-2-0');
    expect(slugifyDisplayName('***')).toBe('app');
  });
});

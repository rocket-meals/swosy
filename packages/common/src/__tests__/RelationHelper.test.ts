import { describe, expect, it } from '@jest/globals';
import { RelationHelper } from '../RelationHelper';

describe('RelationHelper', () => {
  it('reads the key of a plain and of an expanded relation', () => {
    expect(RelationHelper.getId('abc')).toBe('abc');
    expect(RelationHelper.getId({ id: 'abc' })).toBe('abc');
    expect(RelationHelper.getId(42)).toBe('42');
    expect(RelationHelper.getId({ id: 42 })).toBe('42');
  });

  it('treats empty relations as not set', () => {
    expect(RelationHelper.getId(null)).toBeUndefined();
    expect(RelationHelper.getId(undefined)).toBeUndefined();
    expect(RelationHelper.getId('')).toBeUndefined();
    expect(RelationHelper.isSet(null)).toBe(false);
    expect(RelationHelper.isSet({ id: 'abc' })).toBe(true);
  });

  it('keeps the key 0', () => {
    expect(RelationHelper.getId(0)).toBe('0');
    expect(RelationHelper.isSet({ id: 0 })).toBe(true);
  });
});

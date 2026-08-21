import { describe, expect, it } from '@jest/globals';
import { HookKeysHelper } from '../helpers/HookKeysHelper';

describe('HookKeysHelper', () => {
  it('reads the keys a hook was called for', () => {
    expect(HookKeysHelper.getKeysFromMeta({ keys: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(HookKeysHelper.getKeysFromMeta({ keys: [1, 2] })).toEqual([1, 2]);
  });

  it('accepts a single key, however it arrives', () => {
    expect(HookKeysHelper.getKeysFromMeta({ keys: 'a' })).toEqual(['a']);
    expect(HookKeysHelper.getKeysFromMeta({ key: 'a' })).toEqual(['a']);
    expect(HookKeysHelper.getKeysFromMeta({ key: 7 })).toEqual([7]);
  });

  it('returns an empty list when there is nothing to work on', () => {
    expect(HookKeysHelper.getKeysFromMeta(undefined)).toEqual([]);
    expect(HookKeysHelper.getKeysFromMeta({})).toEqual([]);
    expect(HookKeysHelper.getKeysFromMeta({ keys: [] })).toEqual([]);
    expect(HookKeysHelper.getKeysFromMeta({ keys: null })).toEqual([]);
  });

  it('drops unusable entries instead of turning them into "undefined"', () => {
    expect(HookKeysHelper.getKeysFromMeta({ keys: ['a', undefined, null, '', 3] })).toEqual(['a', 3]);
  });

  it('normalizes what a delete filter receives as its payload', () => {
    expect(HookKeysHelper.toPrimaryKeys(['a', 'b'])).toEqual(['a', 'b']);
    expect(HookKeysHelper.toPrimaryKeys('a')).toEqual(['a']);
    expect(HookKeysHelper.toPrimaryKeys(undefined)).toEqual([]);
  });
});

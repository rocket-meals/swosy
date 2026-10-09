import { describe, expect, it } from '@jest/globals';
import { FilterSelectHelper, type FilterSelectOption } from '../FilterSelectHelper';

const options: FilterSelectOption<string>[] = [
  { value: 'app', text: 'App', icon: 'smartphone' },
  { value: 'apple', text: 'App Store', icon: 'apple' },
  { value: 'google_play', text: 'Google Play', icon: 'google_play' },
];

describe('FilterSelectHelper', () => {
  it('treats a single value, a list and nothing alike', () => {
    expect(FilterSelectHelper.getSelectedValues('apple')).toEqual(['apple']);
    expect(FilterSelectHelper.getSelectedValues(['apple', 'app'])).toEqual(['apple', 'app']);
    expect(FilterSelectHelper.getSelectedValues(null)).toEqual([]);
    expect(FilterSelectHelper.getSelectedValues(undefined)).toEqual([]);
  });

  it('ticks and unticks values in the order of the options', () => {
    expect(FilterSelectHelper.toggle(options, ['google_play'], 'apple')).toEqual(['apple', 'google_play']);
    expect(FilterSelectHelper.toggle(options, ['apple', 'google_play'], 'apple')).toEqual(['google_play']);
    expect(FilterSelectHelper.toggle(options, null, 'app')).toEqual(['app']);
    expect(FilterSelectHelper.toggle(options, ['unknown'], 'app')).toEqual(['app']);
  });

  it('shows the texts of the selection, nothing for no selection', () => {
    expect(FilterSelectHelper.getDisplayText(options, ['google_play', 'apple'])).toBe('App Store, Google Play');
    expect(FilterSelectHelper.getDisplayText(options, 'app')).toBe('App');
    expect(FilterSelectHelper.getDisplayText(options, [])).toBeUndefined();
    expect(FilterSelectHelper.getSelectedOptions(options, ['apple']).map(option => option.icon)).toEqual(['apple']);
  });
});

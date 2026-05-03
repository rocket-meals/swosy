import { NumberHelper, StringHelper } from 'repo-depkit-common';

describe('NumberHelper.toFixedNoRounding', () => {
  it('truncates fractional part without rounding', () => {
    expect(NumberHelper.toFixedNoRounding(123.4567, 2)).toBe('123.45');
  });

  it('pads fractional part with zeros when necessary', () => {
    expect(NumberHelper.toFixedNoRounding(12, 3)).toBe('12.000');
  });
});

describe('NumberHelper.formatNumber', () => {
  it('returns placeholder when value is null', () => {
    expect(NumberHelper.formatNumber(null, 'kg', true)).toBe(`?${StringHelper.NONBREAKING_SPACE}kg`);
  });

  it('formats number without rounding when roundUpOrDown is false', () => {
    expect(NumberHelper.formatNumber(12.3456, null, false, ',', null, 2)).toBe('12,34');
  });

  it('applies rounding, thousands separator and unit when requested', () => {
    const result = NumberHelper.formatNumber(1234.556, 'm', true, ',', '.', 2);
    expect(result).toBe(`1.234,56${StringHelper.NONBREAKING_SPACE}m`);
  });
});

describe('NumberHelper.formatCompact', () => {
  it('returns the number as string when below 1000', () => {
    expect(NumberHelper.formatCompact(0)).toBe('0');
    expect(NumberHelper.formatCompact(1)).toBe('1');
    expect(NumberHelper.formatCompact(999)).toBe('999');
  });

  it('formats thousands with k suffix', () => {
    expect(NumberHelper.formatCompact(1000)).toBe('1k');
    expect(NumberHelper.formatCompact(1500)).toBe('1.5k');
    expect(NumberHelper.formatCompact(9900)).toBe('9.9k');
    expect(NumberHelper.formatCompact(999999)).toBe('999.9k');
  });

  it('truncates instead of rounding for k', () => {
    expect(NumberHelper.formatCompact(1050)).toBe('1k');
    expect(NumberHelper.formatCompact(1990)).toBe('1.9k');
  });

  it('formats millions with m suffix', () => {
    expect(NumberHelper.formatCompact(1_000_000)).toBe('1m');
    expect(NumberHelper.formatCompact(1_500_000)).toBe('1.5m');
    expect(NumberHelper.formatCompact(9_900_000)).toBe('9.9m');
  });

  it('truncates instead of rounding for m', () => {
    expect(NumberHelper.formatCompact(1_050_000)).toBe('1m');
    expect(NumberHelper.formatCompact(1_990_000)).toBe('1.9m');
  });
});

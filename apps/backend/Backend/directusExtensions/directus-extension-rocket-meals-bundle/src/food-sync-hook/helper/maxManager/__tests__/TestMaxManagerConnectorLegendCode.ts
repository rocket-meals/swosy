import { describe, expect, it } from '@jest/globals';
import { extractLegendCodeFromText } from '../MaxManagerConnector';

describe('extractLegendCodeFromText correctness', () => {
  it('extracts the code from a parenthesized legend cell', () => {
    expect(extractLegendCodeFromText('(A)')).toBe('A');
    expect(extractLegendCodeFromText('(A1)')).toBe('A1');
  });

  it('returns undefined when there is no parenthesized code', () => {
    expect(extractLegendCodeFromText('no code here')).toBeUndefined();
    expect(extractLegendCodeFromText('')).toBeUndefined();
  });
});

describe('extractLegendCodeFromText reliability (SonarCloud: super-linear regex backtracking)', () => {
  // The rule flagged the previous /\(([^)]+)\)/ pattern for an unbounded quantifier.
  // The fix bounds it ({1,50}) so a pathological, non-matching input can't force
  // runtime proportional to an attacker-controlled input length.
  it('stays fast for a long unterminated parenthesis', () => {
    const pathological = `(${'a'.repeat(1_000_000)}`;
    const start = Date.now();
    const result = extractLegendCodeFromText(pathological);
    const durationMs = Date.now() - start;

    expect(result).toBeUndefined();
    expect(durationMs).toBeLessThan(500);
  });
});

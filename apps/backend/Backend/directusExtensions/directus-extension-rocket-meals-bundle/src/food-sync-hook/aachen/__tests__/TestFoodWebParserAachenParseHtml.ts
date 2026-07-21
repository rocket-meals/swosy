import { describe, expect, it } from '@jest/globals';
import { FoodWebParserAachenParseHtml } from '../FoodWebParserAachenParseHtml';

function htmlWithAdditivesParagraph(paragraphText: string): string {
  return `<html><body><div id="additives"><p>${paragraphText}</p></div></body></html>`;
}

describe('FoodWebParserAachenParseHtml.getMarkingsJSONListFromWebHtml correctness', () => {
  it('extracts codes and descriptions from the additives paragraph', () => {
    const html = htmlWithAdditivesParagraph(
      'mit (1) Farbstoff, (2) Konservierungsstoff, enthält (A) Gluten, (A1) Weizen',
    );

    const markings = FoodWebParserAachenParseHtml.getMarkingsJSONListFromWebHtml(html);

    expect(markings.map((m) => m.external_identifier)).toEqual(['1', '2', 'A', 'A1']);
    expect(markings.find((m) => m.external_identifier === 'A1')?.alias).toBe('Weizen');
  });

  it('returns an empty list when there is no additives div', () => {
    expect(FoodWebParserAachenParseHtml.getMarkingsJSONListFromWebHtml('<html><body></body></html>')).toEqual([]);
  });

  it('returns an empty list for undefined input', () => {
    expect(FoodWebParserAachenParseHtml.getMarkingsJSONListFromWebHtml(undefined)).toEqual([]);
  });
});

describe('FoodWebParserAachenParseHtml regex reliability (SonarCloud: super-linear regex backtracking)', () => {
  // The rule flagged the previous /\(([^)]+)\)\s*([^,(]+)/g pattern: `\s*` overlaps with
  // the following `[^,(]+` character class (both match spaces), which is exactly the
  // ambiguous-adjacent-quantifier shape the rule detects. The fix bounds every
  // quantifier ({1,20} / {0,10} / {1,200}).
  it('stays fast for a pathologically long additives paragraph with many spaces', () => {
    const pathological = `(1)${' '.repeat(500_000)}${'x'.repeat(500_000)}`;
    const html = htmlWithAdditivesParagraph(pathological);

    const start = Date.now();
    FoodWebParserAachenParseHtml.getMarkingsJSONListFromWebHtml(html);
    const durationMs = Date.now() - start;

    expect(durationMs).toBeLessThan(1000);
  });

  it('stays fast for a long unterminated parenthesis', () => {
    const pathological = `(${'1'.repeat(1_000_000)}`;
    const html = htmlWithAdditivesParagraph(pathological);

    const start = Date.now();
    const markings = FoodWebParserAachenParseHtml.getMarkingsJSONListFromWebHtml(html);
    const durationMs = Date.now() - start;

    expect(markings).toEqual([]);
    expect(durationMs).toBeLessThan(1000);
  });
});

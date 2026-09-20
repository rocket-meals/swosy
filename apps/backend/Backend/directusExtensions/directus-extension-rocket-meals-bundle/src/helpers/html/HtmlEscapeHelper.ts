/**
 * HtmlEscapeHelper.ts – Text, der in HTML landet, ohne dass ein Template ihn escapen kann.
 *
 * Die Liquid-Templates escapen ihre Werte selbst (`{{ value | escape }}`). Ein paar Stellen
 * bauen ihr HTML aber von Hand – allen voran die Fußzeile, die Chromium als eigenes Dokument
 * rendert (`footerTemplate`). Dort kommen Namen aus der Datenbank an, und ein `&` oder ein
 * spitzes Klammerpaar darin darf die Fußzeile nicht zerlegen.
 */

import { StringHelper } from 'repo-depkit-common';

/** Reihenfolge zählt: `&` muss zuerst ersetzt werden, sonst zerstört es die späteren Entities. */
const HTML_ESCAPE_REPLACEMENTS: readonly { find: string; replace: string }[] = [
  { find: '&', replace: '&amp;' },
  { find: '<', replace: '&lt;' },
  { find: '>', replace: '&gt;' },
  { find: '"', replace: '&quot;' },
  { find: "'", replace: '&#39;' },
];

export class HtmlEscapeHelper {
  /** Derselbe Zeichensatz, den auch der `escape`-Filter von Liquid ersetzt. */
  public static escapeHtml(text: string | null | undefined): string {
    if (!text) {
      return '';
    }
    let escapedText = text;
    for (const replacement of HTML_ESCAPE_REPLACEMENTS) {
      escapedText = StringHelper.replaceAllLiteralWithOptions({ str: escapedText, find: replacement.find, replace: replacement.replace });
    }
    return escapedText;
  }
}

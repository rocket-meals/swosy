import { interpolateTranslation } from 'repo-depkit-common';
import type { LegalDocumentText } from './LegalDocumentTypes';

/** Same syntax as `interpolateTranslation`: `{{name}}`, optionally padded with spaces. */
const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

export class LegalDocumentRenderer {
  /** Every placeholder name used in `template`, without duplicates. */
  static findPlaceholders(template: string): string[] {
    return [...new Set([...template.matchAll(PLACEHOLDER_PATTERN)].map(match => match[1] ?? ''))];
  }

  /**
   * Fills in the placeholders of title and content. Throws when one has no value, so a half
   * filled document never reaches the users.
   */
  static render(text: LegalDocumentText, values: Readonly<Record<string, string>>): LegalDocumentText {
    const missing = LegalDocumentRenderer.findPlaceholders(text.title + '\n' + text.content).filter(name => values[name] === undefined);
    if (missing.length > 0) {
      throw new Error('No value for the placeholders: ' + missing.join(', '));
    }
    return {
      title: interpolateTranslation(text.title, values),
      content: interpolateTranslation(text.content, values),
    };
  }
}

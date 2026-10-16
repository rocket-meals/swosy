/**
 * LegalDocuments.ts – the legal documents that live in code and are written into the `wikis`
 * collection on every server start (see `LegalDocumentsSync`).
 *
 * The texts are in `documents/<document>/<language>.ts`. Edit them there, not in Directus: an edit in
 * Directus is overwritten on the next start. Company data is never written into a text, only as a
 * placeholder (`{{operator.email}}`, `{{customer.name}}`, see `LegalEntities`).
 */

import { ACCESSIBILITY_TEXTS } from './documents/accessibility';
import { IMPRINT_TEXTS } from './documents/imprint';
import { PRIVACY_POLICY_TEXTS } from './documents/privacyPolicy';
import { TERMS_AND_CONDITIONS_TEXTS } from './documents/termsAndConditions';
import type { TranslationLanguage } from 'repo-depkit-common';

/** One language of a legal document. `content` is Markdown with `{{operator.*}}` / `{{customer.*}}` placeholders. */
export type LegalDocumentText = {
  title: string;
  content: string;
};

/** Every language of a legal document. A `Record` so a missing language fails the typecheck. */
export type LegalDocumentTexts = Record<TranslationLanguage, LegalDocumentText>;

export type LegalDocument = {
  /**
   * The fixed primary key of the wiki. The same on every server, so the document can be found
   * and updated without guessing, and a link to `wikis?id=...` works everywhere.
   */
  wikiId: string;
  /** What the app looks the page up by (`wikis?custom_id=...`, footer, drawer). */
  customId: string;
  alias: string;
  texts: LegalDocumentTexts;
};

/**
 * The wiki ids start with `1e6a1d0c`, "LEGALDOC" in hex speak (`wikis.id` is a uuid column, so only
 * 0-9 and a-f are possible), and count up per document.
 */
export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    wikiId: '1e6a1d0c-0000-4000-8000-000000000001',
    customId: 'privacy-policy',
    alias: 'Datenschutzerklärung',
    texts: PRIVACY_POLICY_TEXTS,
  },
  {
    wikiId: '1e6a1d0c-0000-4000-8000-000000000002',
    customId: 'about-us',
    alias: 'Impressum',
    texts: IMPRINT_TEXTS,
  },
  {
    wikiId: '1e6a1d0c-0000-4000-8000-000000000003',
    customId: 'accessibility',
    alias: 'Barrierefreiheit',
    texts: ACCESSIBILITY_TEXTS,
  },
  {
    wikiId: '1e6a1d0c-0000-4000-8000-000000000004',
    customId: 'terms-and-conditions',
    alias: 'AGB',
    texts: TERMS_AND_CONDITIONS_TEXTS,
  },
];

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
import type { LegalDocument } from './LegalDocumentTypes';

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    wikiId: '16288be8-7cf7-4fb9-a7a4-a6a14b20cbb1',
    customId: 'privacy-policy',
    alias: 'Datenschutzerklärung',
    texts: PRIVACY_POLICY_TEXTS,
  },
  {
    wikiId: '96dcf188-ff3c-47ba-82dc-25f7b8e4f348',
    customId: 'about-us',
    alias: 'Impressum',
    texts: IMPRINT_TEXTS,
  },
  {
    wikiId: '22175c4f-7caa-4ffb-b1e9-871b29f5cdfb',
    customId: 'accessibility',
    alias: 'Barrierefreiheit',
    texts: ACCESSIBILITY_TEXTS,
  },
];

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
];

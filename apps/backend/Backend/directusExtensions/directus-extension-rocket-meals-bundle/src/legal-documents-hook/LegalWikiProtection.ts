/**
 * LegalWikiProtection.ts – decides whether a manual write touches a legal document.
 *
 * The legal documents are maintained in code and rewritten on every start (`LegalDocumentsSync`), a
 * manual edit would silently disappear. So people may only change where a document shows up
 * (`WIKI_DISPLAY_FIELDS`), never its texts, its visibility, its `custom_id`, and they may not delete
 * it. Nobody else may take one of the `custom_id`s either, the app would show the wrong page.
 *
 * Pure logic, the hook in `index.ts` reads what is needed and throws the error.
 */

import { BackendTranslationKeys } from '../helpers/translations/BackendTranslationKeys';
import { LEGAL_DOCUMENTS, type LegalDocument } from './LegalDocuments';
import { WIKI_DISPLAY_FIELDS } from './LegalDocumentsSync';

export type LegalWikiViolation = { key: BackendTranslationKeys; params?: Record<string, string> };

/** Fields Directus sets itself on every update, they never count as a manual change. */
const SYSTEM_FIELDS = ['user_updated', 'date_updated'];

const EDIT_FORBIDDEN: LegalWikiViolation = { key: BackendTranslationKeys.legal_document_edit_forbidden };

export class LegalWikiProtection {
  private readonly wikiIds: ReadonlySet<string>;
  private readonly customIds: ReadonlySet<string>;

  constructor(documents: readonly LegalDocument[] = LEGAL_DOCUMENTS) {
    this.wikiIds = new Set(documents.map(document => document.wikiId));
    this.customIds = new Set(documents.map(document => document.customId));
  }

  isLegalWiki(id: unknown): boolean {
    return this.wikiIds.has(String(id));
  }

  checkWikiCreate(payload: Record<string, unknown>): LegalWikiViolation | null {
    if (this.isLegalWiki(payload.id)) {
      return EDIT_FORBIDDEN;
    }
    return this.checkReservedCustomId(payload);
  }

  checkWikiUpdate(keys: readonly unknown[], payload: Record<string, unknown>): LegalWikiViolation | null {
    if (keys.some(key => this.isLegalWiki(key))) {
      const editable: readonly string[] = [...WIKI_DISPLAY_FIELDS, ...SYSTEM_FIELDS];
      return Object.keys(payload).every(field => editable.includes(field)) ? null : EDIT_FORBIDDEN;
    }
    return this.checkReservedCustomId(payload);
  }

  checkWikiDelete(keys: readonly unknown[]): LegalWikiViolation | null {
    return keys.some(key => this.isLegalWiki(key)) ? EDIT_FORBIDDEN : null;
  }

  /** A translation row may not be created, changed or deleted when it belongs to a legal wiki. */
  checkTranslationWrite(wikiIds: readonly unknown[]): LegalWikiViolation | null {
    return wikiIds.some(wikiId => this.isLegalWiki(wikiId)) ? EDIT_FORBIDDEN : null;
  }

  private checkReservedCustomId(payload: Record<string, unknown>): LegalWikiViolation | null {
    const customId = payload.custom_id;
    if (typeof customId === 'string' && this.customIds.has(customId)) {
      return { key: BackendTranslationKeys.legal_document_custom_id_reserved, params: { custom_id: customId } };
    }
    return null;
  }
}

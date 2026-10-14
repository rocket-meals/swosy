/**
 * LegalDocumentsSync.ts – writes the legal documents from code (`LEGAL_DOCUMENTS`) into the `wikis`
 * collection, with the company data of this server filled in.
 *
 * Per document:
 * - The wiki has a fixed id. If it does not exist yet, it is created and takes over the display
 *   settings (drawer, position, icon, ...) of a wiki that had the same `custom_id` before.
 * - Every other wiki with that `custom_id` is archived and renamed (`legacy-<custom_id>`), so the
 *   app only finds the one from code.
 * - Per language of the `languages` collection the translation is created or updated, but only when
 *   title or content changed. The rows are excluded from the auto translation, the texts come from code.
 *
 * Writes never emit events: no auto translation, no other hooks.
 */

import { isSameLanguageCode, normalizeTranslationLanguage } from 'repo-depkit-common';
import { CustomerLegalEntity, LegalEntities, OPERATOR_LEGAL_ENTITY, OperatorLegalEntity } from './LegalEntities';
import { LegalDocumentRenderer } from './LegalDocumentRenderer';
import type { LegalDocument, LegalDocumentText } from './LegalDocumentTypes';

export const LEGACY_CUSTOM_ID_PREFIX = 'legacy-';
const STATUS_ARCHIVED = 'archived';

/** The fields of a replaced wiki the new one takes over, so it shows up in the same place in the app. */
export const WIKI_DISPLAY_FIELDS = ['parent', 'position', 'sort', 'icon', 'color', 'public', 'show_in_drawer', 'show_in_drawer_as_bottom_item'] as const;

export type LegalWikiTranslation = { id: number; languages_code: string | null; title: string | null; content: string | null };
export type LegalWiki = { id: string; custom_id: string | null; status: string | null } & Partial<Record<(typeof WIKI_DISPLAY_FIELDS)[number], unknown>>;

/** What the sync needs from the database. Implemented with Directus services in `DirectusLegalDocumentsDatabase`. */
export interface LegalDocumentsDatabase {
  readLanguageCodes(): Promise<string[]>;
  readWikisByIdOrCustomId(id: string, customId: string): Promise<LegalWiki[]>;
  readTranslations(wikiId: string): Promise<LegalWikiTranslation[]>;
  createWiki(wiki: Record<string, unknown>): Promise<void>;
  updateWiki(id: string, update: Record<string, unknown>): Promise<void>;
  /** One nested write on the wiki: `create` rows are new, `update` rows carry their `id`. */
  writeTranslations(wikiId: string, create: Record<string, unknown>[], update: Record<string, unknown>[]): Promise<void>;
}

export type LegalDocumentsSyncResult = { log: string[] };

export class LegalDocumentsSync {
  constructor(
    private readonly database: LegalDocumentsDatabase,
    private readonly operator: OperatorLegalEntity = OPERATOR_LEGAL_ENTITY
  ) {}

  /** Syncs every document. A failing document is logged and does not stop the others. */
  async syncAll(documents: readonly LegalDocument[], customer: CustomerLegalEntity): Promise<LegalDocumentsSyncResult> {
    const log: string[] = [];
    const values = LegalEntities.buildPlaceholderValues(this.operator, customer);
    const languageCodes = await this.database.readLanguageCodes();
    for (const document of documents) {
      try {
        log.push(...(await this.syncDocument(document, values, languageCodes))); // NOSONAR S9382 - sequential on purpose: a few documents, bounded DB load
      } catch (error) {
        log.push(`${document.customId}: failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return { log };
  }

  /** Per language code of the server the rendered text, languages without a text in code are skipped. */
  static renderForLanguages(document: LegalDocument, values: Readonly<Record<string, string>>, languageCodes: readonly string[]): { languageCode: string; text: LegalDocumentText }[] {
    return languageCodes.flatMap(languageCode => {
      const language = normalizeTranslationLanguage(languageCode);
      return language ? [{ languageCode, text: LegalDocumentRenderer.render(document.texts[language], values) }] : [];
    });
  }

  private async syncDocument(document: LegalDocument, values: Readonly<Record<string, string>>, languageCodes: readonly string[]): Promise<string[]> {
    const log: string[] = [];
    // Rendered first: a missing placeholder value must not leave a half migrated wiki behind.
    const rendered = LegalDocumentsSync.renderForLanguages(document, values, languageCodes);

    const wikis = await this.database.readWikisByIdOrCustomId(document.wikiId, document.customId);
    const others = wikis.filter(wiki => wiki.id !== document.wikiId);
    if (!wikis.some(wiki => wiki.id === document.wikiId)) {
      const replaced = others[0];
      const displaySettings = Object.fromEntries(WIKI_DISPLAY_FIELDS.filter(field => replaced?.[field] !== undefined).map(field => [field, replaced?.[field]]));
      await this.database.createWiki({ ...displaySettings, id: document.wikiId, custom_id: document.customId, alias: document.alias });
      log.push(`${document.customId}: created wiki ${document.wikiId}` + (replaced ? ` with the display settings of ${replaced.id}` : ''));
    }
    for (const other of others) {
      await this.database.updateWiki(other.id, { custom_id: LEGACY_CUSTOM_ID_PREFIX + document.customId, status: STATUS_ARCHIVED }); // NOSONAR S9382 - sequential on purpose: usually one old wiki
      log.push(`${document.customId}: archived the old wiki ${other.id}`);
    }

    const translations = await this.database.readTranslations(document.wikiId);
    const create: Record<string, unknown>[] = [];
    const update: Record<string, unknown>[] = [];
    for (const { languageCode, text } of rendered) {
      const existing = translations.find(translation => isSameLanguageCode(translation.languages_code, languageCode));
      const fields = { title: text.title, content: text.content, let_be_translated: false, be_source_for_translations: false };
      if (!existing) {
        create.push({ ...fields, languages_code: languageCode });
        log.push(`${document.customId}: created ${languageCode}`);
      } else if (existing.title !== text.title || existing.content !== text.content) {
        update.push({ ...fields, id: existing.id });
        log.push(`${document.customId}: updated ${languageCode}`);
      }
    }
    if (create.length > 0 || update.length > 0) {
      await this.database.writeTranslations(document.wikiId, create, update);
    }
    return log;
  }
}

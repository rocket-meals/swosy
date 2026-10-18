/**
 * LegalDocumentsSync.ts – writes the legal documents from code (`LEGAL_DOCUMENTS`) into the `wikis`
 * collection, with the company data of this server filled in.
 *
 * Per document:
 * - The wiki has a fixed id. If it does not exist yet, it is created and takes over the position and
 *   look (position, icon, ...) of a wiki that had the same `custom_id` before.
 * - The visibility (`LEGAL_WIKI_SETTINGS`: public, at the bottom of the drawer) is enforced on every
 *   start: a legal document must stay reachable for everybody, also without an account.
 * - Every other wiki with that `custom_id` is archived and renamed (`legacy-<custom_id>`), so the
 *   app only finds the one from code.
 * - Per language of the `languages` collection the translation is created or updated, but only when
 *   title or content changed. The rows are excluded from the auto translation, the texts come from code.
 *
 * Writes never emit events: no auto translation, no other hooks. That also skips the hook that keeps
 * `collections_dates_last_update` current, so the apps would keep their cached wikis. The sync
 * therefore marks the wikis as changed itself whenever a legal wiki is newer than that date, which
 * also catches up servers that ran an older sync without this step.
 */

import { CustomerLegalEntity, isSameLanguageCode, normalizeTranslationLanguage, OPERATOR_LEGAL_ENTITY, OperatorLegalEntity } from 'repo-depkit-common';
import { LegalEntities } from './LegalEntities';
import { LegalDocumentRenderer } from './LegalDocumentRenderer';
import type { LegalDocument, LegalDocumentText } from './LegalDocuments';

export const LEGACY_CUSTOM_ID_PREFIX = 'legacy-';
const STATUS_ARCHIVED = 'archived';

/** The fields of a replaced wiki the new one takes over, so it shows up in the same place in the app. */
export const WIKI_DISPLAY_FIELDS = ['parent', 'position', 'sort', 'icon', 'color'] as const;

/**
 * Enforced on every start: published, readable without an account, in the footer and at the bottom
 * of the drawer (not in its main list) and shown as a page, not as a link (`url`).
 */
export const LEGAL_WIKI_SETTINGS = {
  status: 'published',
  public: true,
  show_in_drawer: false,
  show_in_drawer_as_bottom_item: true,
  url: null,
} as const;

export type LegalWikiTranslation = { id: number; languages_code: string | null; title: string | null; content: string | null };
export type LegalWiki = { id: string; custom_id: string | null } & Partial<Record<(typeof WIKI_DISPLAY_FIELDS)[number] | keyof typeof LEGAL_WIKI_SETTINGS, unknown>>;

/** What the sync needs from the database. Implemented with Directus services in `DirectusLegalDocumentsDatabase`. */
export interface LegalDocumentsDatabase {
  readLanguageCodes(): Promise<string[]>;
  readWikisByIdOrCustomId(id: string, customId: string): Promise<LegalWiki[]>;
  readTranslations(wikiId: string): Promise<LegalWikiTranslation[]>;
  createWiki(wiki: Record<string, unknown>): Promise<void>;
  updateWiki(id: string, update: Record<string, unknown>): Promise<void>;
  /** One nested write on the wiki: `create` rows are new, `update` rows carry their `id`. */
  writeTranslations(wikiId: string, create: Record<string, unknown>[], update: Record<string, unknown>[]): Promise<void>;
  /** The latest `date_updated` / `date_created` of the given wikis, `null` when none exists. */
  readLastChangeOfWikis(wikiIds: readonly string[]): Promise<Date | null>;
  /** When the apps were last told that the wikis changed (`collections_dates_last_update`), `null` when never. */
  readWikisLastUpdateForApps(): Promise<Date | null>;
  /** Tells the apps to fetch the wikis again (`collections_dates_last_update` of `wikis` and `wikis_translations`). */
  markWikisChangedForApps(): Promise<void>;
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
    try {
      if (await this.appsHaveOutdatedWikis(documents)) {
        await this.database.markWikisChangedForApps();
        log.push('marked the wikis as changed, the apps fetch them again');
      }
    } catch (error) {
      log.push(`marking the wikis as changed failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { log };
  }

  /** True when a legal wiki changed after the date the apps compare their cached wikis against. */
  private async appsHaveOutdatedWikis(documents: readonly LegalDocument[]): Promise<boolean> {
    const lastChange = await this.database.readLastChangeOfWikis(documents.map(document => document.wikiId));
    if (!lastChange) {
      return false;
    }
    const lastUpdateForApps = await this.database.readWikisLastUpdateForApps();
    return !lastUpdateForApps || lastUpdateForApps.getTime() < lastChange.getTime();
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
    const wiki = wikis.find(candidate => candidate.id === document.wikiId);
    if (wiki) {
      const changedSettings = Object.entries(LEGAL_WIKI_SETTINGS).filter(([field, value]) => (wiki[field as keyof LegalWiki] ?? null) !== value);
      if (changedSettings.length > 0) {
        await this.database.updateWiki(wiki.id, Object.fromEntries(changedSettings));
        log.push(`${document.customId}: reset ${changedSettings.map(([field]) => field).join(', ')}`);
      }
    } else {
      const replaced = others[0];
      const displaySettings = Object.fromEntries(WIKI_DISPLAY_FIELDS.filter(field => replaced?.[field] !== undefined).map(field => [field, replaced?.[field]]));
      await this.database.createWiki({ ...displaySettings, ...LEGAL_WIKI_SETTINGS, id: document.wikiId, custom_id: document.customId, alias: document.alias });
      log.push(`${document.customId}: created wiki ${document.wikiId}` + (replaced ? ` at the position of ${replaced.id}` : ''));
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

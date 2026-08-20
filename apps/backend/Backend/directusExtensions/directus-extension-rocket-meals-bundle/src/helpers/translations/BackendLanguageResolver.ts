/**
 * BackendLanguageResolver.ts – picks the language a user gets their texts in.
 *
 * The app resolves a language the same way: it takes the locales the device reports and picks
 * the first one it actually ships texts for, German otherwise. The server has to do the same,
 * only its "list of supported languages" is the Directus `languages` collection, which each
 * customer maintains themselves. Matching against that table matters because two different
 * lookups hang off the result:
 *
 * - **Database content** (meal names, news) lives in `*_translations` rows keyed by the full
 *   `languages.code` – so a `"de"` in a profile has to become the table's `"de-DE"` to match.
 * - **Server texts** (push notifications, documents) live in the translation catalogue keyed by
 *   the short code – so `"de-DE"` has to become `"de"`.
 *
 * `profiles.language` is a relation, so it arrives either as the raw foreign key (`"de-DE"`) or
 * as an expanded row (`{ code: "de-DE" }`), depending on whether the caller fetched it. Both are
 * accepted, exactly like in the app.
 */

import { DatabaseTypes, isSameBaseLanguage, isSameLanguageCode, normalizeTranslationLanguage, TranslationLanguage, type Translator } from 'repo-depkit-common';

import { BackendTranslationKeys } from './BackendTranslationKeys';
import { BACKEND_DEFAULT_TRANSLATION_LANGUAGE, BackendLanguageSource, BackendTranslator, ProfileWithLanguage } from './BackendTranslator';

const HELPER_NAME = 'BackendLanguageResolver';

/** The language to use, in both the shapes the two lookups need. */
export type ResolvedBackendLanguage = {
  /**
   * The `languages.code` to compare `translations.languages_code` against – the matching row
   * from the `languages` table, or the profile's raw value when the table has no match for it.
   */
  languageCode: string | undefined;
  /** The short code the text catalogue is keyed by. Never undefined; German when nothing matches. */
  translationLanguage: TranslationLanguage;
  /** A `translate` function already bound to {@link translationLanguage}. */
  translate: Translator<BackendTranslationKeys>;
};

/** The bit of `MyDatabaseHelper` this resolver needs – kept structural to avoid an import cycle. */
export type LanguagesReadingDatabaseHelper = {
  getLanguagesHelper(): {
    readByQuery(query: Record<string, unknown>): Promise<DatabaseTypes.Languages[]>;
  };
};

function readLanguageCode(source: BackendLanguageSource): string | undefined {
  const code = typeof source === 'string' ? source : source?.code;
  return code && code.trim().length > 0 ? code.trim() : undefined;
}

export class BackendLanguageResolver {
  private readonly databaseHelper: LanguagesReadingDatabaseHelper;
  private availableLanguages: DatabaseTypes.Languages[] | undefined;

  constructor(databaseHelper: LanguagesReadingDatabaseHelper) {
    this.databaseHelper = databaseHelper;
  }

  /**
   * The rows of the `languages` collection, read once and kept.
   *
   * A schedule resolves a language per notified profile; without the cache that would be one
   * query per profile against a table that has a handful of rows and does not change mid-run.
   */
  async getAvailableLanguages(): Promise<DatabaseTypes.Languages[]> {
    if (this.availableLanguages !== undefined) {
      return this.availableLanguages;
    }
    try {
      this.availableLanguages = await this.databaseHelper.getLanguagesHelper().readByQuery({ limit: -1 });
    } catch (error) {
      // An install where the collection is missing or not readable still gets German texts
      // instead of a failed notification run.
      console.warn(`${HELPER_NAME}: Could not read the languages collection`, error);
      this.availableLanguages = [];
    }
    return this.availableLanguages;
  }

  /** The language for one profile, matched against the `languages` collection. */
  async resolveForProfile(profile: ProfileWithLanguage | null | undefined): Promise<ResolvedBackendLanguage> {
    return BackendLanguageResolver.resolveWithAvailableLanguages(profile?.language, await this.getAvailableLanguages());
  }

  /**
   * The matching itself, without a database.
   *
   * Tried in order: the exact code, the same base language (`"de"` matches `"de-DE"`), then the
   * app's own fallback order – German, English, whatever the table offers first.
   */
  static resolveWithAvailableLanguages(source: BackendLanguageSource, availableLanguages: readonly DatabaseTypes.Languages[]): ResolvedBackendLanguage {
    const requestedCode = readLanguageCode(source);
    const availableCodes = availableLanguages
      .map(language => language?.code)
      .filter((code): code is string => typeof code === 'string' && code.trim().length > 0);

    const matchedCode = BackendLanguageResolver._findBestMatchingCode(requestedCode, availableCodes);
    // Without a match the profile's own value is still the best guess for the content lookup:
    // it is what the previous behaviour compared against, and the table may just be unreadable.
    const languageCode = matchedCode ?? requestedCode;
    const translationLanguage = normalizeTranslationLanguage(languageCode) ?? BACKEND_DEFAULT_TRANSLATION_LANGUAGE;

    return {
      languageCode,
      translationLanguage,
      translate: BackendTranslator.getTranslator(translationLanguage),
    };
  }

  /** The code from `availableCodes` that fits `requestedCode` best, or undefined for an empty table. */
  static _findBestMatchingCode(requestedCode: string | undefined, availableCodes: readonly string[]): string | undefined {
    if (availableCodes.length === 0) {
      return undefined;
    }

    if (requestedCode) {
      // The exact code wins, but only ignoring case: nothing keeps a hand-maintained
      // `languages.code` or a device locale from arriving as "DE-de".
      const exactMatch = availableCodes.find(code => isSameLanguageCode(code, requestedCode));
      if (exactMatch) {
        return exactMatch;
      }

      // Then the same language in any region – the app stores "de", the table has "de-DE".
      const baseLanguageMatch = availableCodes.find(code => isSameBaseLanguage(code, requestedCode));
      if (baseLanguageMatch) {
        return baseLanguageMatch;
      }
    }

    for (const fallbackLanguage of [BACKEND_DEFAULT_TRANSLATION_LANGUAGE, TranslationLanguage.EN]) {
      const fallbackMatch = availableCodes.find(code => isSameBaseLanguage(code, fallbackLanguage));
      if (fallbackMatch) {
        return fallbackMatch;
      }
    }

    return availableCodes[0];
  }
}

/**
 * BackendTranslator.ts – turns a backend translation key into a text in the user's language.
 *
 * This is the **static catalogue**: texts written by developers, shipped with the code, looked up
 * by key. Nothing is translated at runtime here. The two neighbours it is easy to confuse it with:
 * - `helpers/ContentTranslationHelper.ts` – **content** from the database (meal names, news),
 *   stored per item in `*_translations` rows.
 * - `auto-translation-hook/AutoTranslator.ts` – **machine translation** via DeepL, which produces
 *   those content translations and costs API quota per call.
 *
 * The backend knows the user's language from `profiles.language`, which is a relation to the
 * Directus `languages` collection and therefore holds a full locale code such as `"de-DE"`.
 * The translation catalogue is keyed by the short code (`"de"`), so every language that reaches
 * this module is normalised first. Anything unusable – no profile, no language set, a language
 * the apps do not ship texts for – falls back to German, the same default the apps use when the
 * device locale is unknown.
 *
 * ```ts
 * const translate = BackendTranslator.getTranslatorForProfile(profile);
 * translate(BackendTranslationKeys.today);                                  // 'Heute' / 'Today' / …
 * translate(BackendTranslationKeys.notification_foodoffer_body, {           // '24.08.2026: Lasagne'
 * 	date: '24.08.2026',
 * 	food: 'Lasagne',
 * });
 * ```
 */

import {
  commonTranslations,
  createTranslator,
  DatabaseTypes,
  mergeTranslationResources,
  normalizeTranslationLanguage,
  TranslationLanguage,
  type TranslationParams,
  type TranslationResources,
  type Translator,
} from 'repo-depkit-common';

import { BackendTranslationKeys } from './BackendTranslationKeys';
import { backendTranslations } from './backendTranslations';

/**
 * German, like the apps: `settingsReducer` starts on `'de'` and the app only leaves it when the
 * device reports a different supported locale. A user without a language in their profile
 * therefore keeps getting the texts they already know from the app.
 */
export const BACKEND_DEFAULT_TRANSLATION_LANGUAGE: TranslationLanguage = TranslationLanguage.DE;

/** The shared app vocabulary plus the backend-only texts. */
export const backendTranslationResources: TranslationResources = mergeTranslationResources(
  commonTranslations,
  backendTranslations
);

/**
 * Anything the database may hand out as a language: the raw foreign key (`"de-DE"`), an expanded
 * `languages` row, or nothing at all.
 */
export type BackendLanguageSource = string | DatabaseTypes.Languages | null | undefined;

/** Just enough of a profile to read its language – so callers can pass a partial row. */
export type ProfileWithLanguage = {
  language?: BackendLanguageSource;
};

/**
 * BCP-47 tags used for date and number formatting. The catalogue is keyed by the short code, but
 * `toLocaleDateString` needs a region to pick a day/month order.
 */
const LOCALE_BY_TRANSLATION_LANGUAGE: Record<TranslationLanguage, string> = {
  [TranslationLanguage.DE]: 'de-DE',
  [TranslationLanguage.EN]: 'en-US',
  [TranslationLanguage.AR]: 'ar-EG',
  [TranslationLanguage.ES]: 'es-ES',
  [TranslationLanguage.FR]: 'fr-FR',
  [TranslationLanguage.RU]: 'ru-RU',
  [TranslationLanguage.TR]: 'tr-TR',
  [TranslationLanguage.ZH]: 'zh-CN',
};

export class BackendTranslator {
  /**
   * The short language code for a database value, falling back to
   * {@link BACKEND_DEFAULT_TRANSLATION_LANGUAGE}.
   *
   * Accepts `"de"`, `"de-DE"`, `"de_DE"` and an expanded `languages` row alike, because which of
   * those a hook sees depends on whether it fetched the relation.
   */
  static resolveLanguage(source: BackendLanguageSource): TranslationLanguage {
    const languageCode = typeof source === 'string' ? source : source?.code;
    return normalizeTranslationLanguage(languageCode) ?? BACKEND_DEFAULT_TRANSLATION_LANGUAGE;
  }

  /** The language a profile's texts should be rendered in. */
  static resolveLanguageForProfile(profile: ProfileWithLanguage | null | undefined): TranslationLanguage {
    return BackendTranslator.resolveLanguage(profile?.language);
  }

  /** A `translate` function bound to one language. */
  static getTranslator(source: BackendLanguageSource): Translator<BackendTranslationKeys> {
    return createTranslator<BackendTranslationKeys>({
      resources: backendTranslationResources,
      language: BackendTranslator.resolveLanguage(source),
    });
  }

  /** A `translate` function bound to the language a user chose in their profile. */
  static getTranslatorForProfile(profile: ProfileWithLanguage | null | undefined): Translator<BackendTranslationKeys> {
    return BackendTranslator.getTranslator(profile?.language);
  }

  /** One-off lookup for call sites that translate a single text. */
  static translate(key: BackendTranslationKeys, source?: BackendLanguageSource, params?: TranslationParams): string {
    return BackendTranslator.getTranslator(source)(key, params);
  }

  /** The BCP-47 tag to format dates and numbers with for a given language. */
  static getLocale(source: BackendLanguageSource): string {
    return LOCALE_BY_TRANSLATION_LANGUAGE[BackendTranslator.resolveLanguage(source)];
  }

  /**
   * A date the user can read, in their own language – `24.08.2026`, `08/24/2026`, `2026/08/24`.
   *
   * Falls back to the German format when the runtime has no locale data for the language, which
   * a Node build without full ICU would run into.
   */
  static formatDate(date: Date, source: BackendLanguageSource): string {
    const dateFormatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    try {
      return date.toLocaleDateString(BackendTranslator.getLocale(source), dateFormatOptions);
    } catch {
      return date.toLocaleDateString(LOCALE_BY_TRANSLATION_LANGUAGE[TranslationLanguage.DE], dateFormatOptions);
    }
  }
}

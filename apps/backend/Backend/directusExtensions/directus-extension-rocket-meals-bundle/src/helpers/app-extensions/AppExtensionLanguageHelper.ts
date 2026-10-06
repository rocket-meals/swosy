/**
 * AppExtensionLanguageHelper.ts – texts of the Vue extensions this bundle adds to the Directus app.
 *
 * The Directus app (Insights panels `[Erweitert]`, the `Rocket Meals` module) shows texts to
 * backend users. Like everything else in the backend they come from the static catalogue
 * (`helpers/translations/`), never from literals. This helper picks the language for them.
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node. Inside Vue
 * components use `useAppExtensionTranslate`, which follows the language of the logged-in user.
 */

import { BackendTranslator } from '../translations/BackendTranslator';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import type { TranslationParams } from 'repo-depkit-common/src/translations';

export class AppExtensionLanguageHelper {
  /**
   * Translates a key for a language as Directus or the browser reports it (`de-DE`, `en-US`, …).
   * Unknown languages fall back to German, like everywhere else in the backend.
   */
  static translate(key: BackendTranslationKeys, language?: string | null, params?: TranslationParams): string {
    return BackendTranslator.translate(key, language ?? undefined, params);
  }

  /**
   * The language the Directus UI is shown in right now (`de-DE`, `en-US`, …).
   *
   * Directus writes it to `<html lang>` whenever the language changes, right before it re-reads
   * the names of all extensions. Extension definitions (panel names, module name, option labels)
   * therefore expose their texts as getters that call this, so they follow the UI language
   * instead of the language the extension happened to be loaded in. Falls back to the browser.
   */
  static getUiLanguage(): string | undefined {
    if (typeof document !== 'undefined' && document.documentElement?.lang) {
      return document.documentElement.lang;
    }
    if (typeof navigator !== 'undefined') {
      return navigator.language;
    }
    return undefined;
  }

  /**
   * The language of a backend user: their own choice, else the project default, else the UI.
   * Mirrors how Directus itself picks the UI language.
   */
  static resolveUserLanguage(userLanguage?: string | null, projectDefaultLanguage?: string | null): string | undefined {
    return userLanguage || projectDefaultLanguage || AppExtensionLanguageHelper.getUiLanguage();
  }

  /** `06.10.2026, 09:45` / `Oct 6, 2026, 9:45 AM` – date and time in the user's language. */
  static formatDateTime(date: string | Date | null | undefined, language?: string | null): string {
    if (!date) {
      return '';
    }
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }
    const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
    try {
      return parsedDate.toLocaleString(BackendTranslator.getLocale(language ?? undefined), options);
    } catch {
      return parsedDate.toLocaleString(BackendTranslator.getLocale(undefined), options);
    }
  }
}

/**
 * TranslationTypes.ts – the data shapes every app in this monorepo stores its texts in.
 *
 * The storage layout is "key first, language second":
 *
 * ```json
 * { "save": { "de": "Speichern", "en": "Save" } }
 * ```
 *
 * That layout keeps all languages of one text next to each other, which is what makes a
 * missing translation reviewable in a diff. i18next wants the transposed layout – use
 * {@link toI18nextResources} from `TranslationHelper` for that conversion.
 */

import type { TranslationLanguage } from './TranslationLanguage';

/** All translations of a single key, keyed by short language code. */
export type TranslationTextEntry = Partial<Record<TranslationLanguage, string>>;

/** A whole translation catalogue: translation key -> {@link TranslationTextEntry}. */
export type TranslationResources = Record<string, TranslationTextEntry>;

/** i18next-compatible layout: language -> (translation key -> text). */
export type I18nextResources = Record<string, Record<string, string>>;

/** Placeholder values interpolated into a text, e.g. `{{count}}`. */
export type TranslationParams = Record<string, string | number>;

/**
 * Resolves a translation key to the text for the currently selected language.
 *
 * Created by `createTranslator`. The generic parameter lets an app narrow the accepted
 * keys to its own key union, so a typo is a compile error rather than a raw key on screen.
 */
export type Translator<TKey extends string = string> = (key: TKey, params?: TranslationParams) => string;

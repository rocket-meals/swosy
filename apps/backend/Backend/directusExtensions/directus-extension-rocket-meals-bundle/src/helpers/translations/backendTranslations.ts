/**
 * backendTranslations.ts – the texts for the backend-only keys of {@link BackendTranslationKeys}.
 *
 * Only keys that no app would ever show belong here. Everything generic (`Ja`, `Heute`, `Fehler`,
 * weekdays, months, …) comes from `commonTranslations` in `repo-depkit-common` and must not be
 * repeated – `BackendTranslations.test.ts` fails on a duplicate as well as on a missing language.
 *
 * Every key carries a non-empty text in **all** `ALL_TRANSLATION_LANGUAGES`, because a user with
 * an Arabic profile gets an Arabic push notification, not a German one with an Arabic fallback.
 */

import type { TranslationResources } from 'repo-depkit-common';

export const backendTranslations: TranslationResources = {
  /**
   * Body of the "your meal is served soon" push notification.
   * `{{date}}` is a day the user recognises ("Morgen", "24.08.2026"), `{{food}}` the meal name.
   */
  notification_foodoffer_body: {
    de: '{{date}}: {{food}}',
    en: '{{date}}: {{food}}',
    ar: '{{date}}: {{food}}',
    es: '{{date}}: {{food}}',
    fr: '{{date}} : {{food}}',
    ru: '{{date}}: {{food}}',
    tr: '{{date}}: {{food}}',
    zh: '{{date}}：{{food}}',
  },

  /** Used as `{{food}}` when the meal has no name in any language the user could read. */
  notification_foodoffer_unknown_food: {
    de: 'ein Gericht',
    en: 'a meal',
    ar: 'وجبة',
    es: 'un plato',
    fr: 'un plat',
    ru: 'блюдо',
    tr: 'bir yemek',
    zh: '一道菜',
  },
};

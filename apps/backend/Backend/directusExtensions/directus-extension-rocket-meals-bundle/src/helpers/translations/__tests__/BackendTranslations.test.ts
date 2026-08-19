import { describe, expect, it } from '@jest/globals';
import {
  ALL_TRANSLATION_LANGUAGES,
  CommonTranslationKeys,
  formatTranslationValidationReport,
  TranslationLanguage,
  validateTranslations,
} from 'repo-depkit-common';

import { ALL_BACKEND_TRANSLATION_KEYS, BackendTranslationKeys } from '../BackendTranslationKeys';
import { backendTranslations } from '../backendTranslations';
import {
  BACKEND_DEFAULT_TRANSLATION_LANGUAGE,
  BackendTranslator,
  backendTranslationResources,
} from '../BackendTranslator';

describe('backend translation catalogue', () => {
  it('has a non-empty text in every language for every declared key', () => {
    const report = validateTranslations({
      keys: ALL_BACKEND_TRANSLATION_KEYS,
      resources: backendTranslationResources,
      keyDeclarations: BackendTranslationKeys,
    });

    expect(formatTranslationValidationReport(report)).toBe('No translation problems found.');
    expect(report.isValid).toBe(true);
  });

  it('does not restate a key that repo-depkit-common already provides', () => {
    const commonKeys = new Set<string>(Object.values(CommonTranslationKeys));
    const restatedKeys = Object.keys(backendTranslations).filter(key => commonKeys.has(key));

    expect(restatedKeys).toEqual([]);
  });

  it('inherits the shared vocabulary', () => {
    expect(BackendTranslationKeys.today).toBe(CommonTranslationKeys.today);
    expect(BackendTranslationKeys.yes).toBe(CommonTranslationKeys.yes);
  });
});

describe('BackendTranslator.resolveLanguage', () => {
  it('accepts the locale code the languages collection stores', () => {
    expect(BackendTranslator.resolveLanguage('de-DE')).toBe(TranslationLanguage.DE);
    expect(BackendTranslator.resolveLanguage('en-US')).toBe(TranslationLanguage.EN);
  });

  it('accepts a short code and an expanded languages relation', () => {
    expect(BackendTranslator.resolveLanguage('fr')).toBe(TranslationLanguage.FR);
    expect(BackendTranslator.resolveLanguage({ code: 'zh-CN' })).toBe(TranslationLanguage.ZH);
  });

  it('falls back to German for anything unusable', () => {
    expect(BACKEND_DEFAULT_TRANSLATION_LANGUAGE).toBe(TranslationLanguage.DE);
    expect(BackendTranslator.resolveLanguage(undefined)).toBe(TranslationLanguage.DE);
    expect(BackendTranslator.resolveLanguage(null)).toBe(TranslationLanguage.DE);
    expect(BackendTranslator.resolveLanguage('')).toBe(TranslationLanguage.DE);
    // Italian is a valid locale, but the apps ship no texts for it.
    expect(BackendTranslator.resolveLanguage('it-IT')).toBe(TranslationLanguage.DE);
  });

  it('reads the language out of a profile', () => {
    expect(BackendTranslator.resolveLanguageForProfile({ language: 'tr-TR' })).toBe(TranslationLanguage.TR);
    expect(BackendTranslator.resolveLanguageForProfile({})).toBe(TranslationLanguage.DE);
    expect(BackendTranslator.resolveLanguageForProfile(undefined)).toBe(TranslationLanguage.DE);
  });
});

describe('BackendTranslator.translate', () => {
  it('renders a text in the language of the profile', () => {
    const translate = BackendTranslator.getTranslatorForProfile({ language: 'en-US' });

    expect(translate(BackendTranslationKeys.tomorrow)).toBe('Tomorrow');
  });

  it('renders German when the profile has no language', () => {
    const translate = BackendTranslator.getTranslatorForProfile({ language: null });

    expect(translate(BackendTranslationKeys.tomorrow)).toBe('Morgen');
    expect(translate(BackendTranslationKeys.yes)).toBe('Ja');
    expect(translate(BackendTranslationKeys.no)).toBe('Nein');
  });

  it('interpolates the push notification body', () => {
    const body = BackendTranslator.translate(BackendTranslationKeys.notification_foodoffer_body, 'en-US', {
      date: 'Tomorrow',
      food: 'Lasagne',
    });

    expect(body).toBe('Tomorrow: Lasagne');
  });

  it('has a fallback meal name in every language', () => {
    for (const language of ALL_TRANSLATION_LANGUAGES) {
      const text = BackendTranslator.translate(BackendTranslationKeys.notification_foodoffer_unknown_food, language);

      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toBe(BackendTranslationKeys.notification_foodoffer_unknown_food);
    }
  });
});

describe('BackendTranslator.formatDate', () => {
  const date = new Date(Date.UTC(2026, 7, 24, 12, 0, 0));

  it('uses the day-first order for German', () => {
    expect(BackendTranslator.formatDate(date, 'de-DE')).toBe('24.08.2026');
  });

  it('uses the month-first order for English', () => {
    expect(BackendTranslator.formatDate(date, 'en-US')).toBe('08/24/2026');
  });

  it('falls back to the German format for an unknown language', () => {
    expect(BackendTranslator.formatDate(date, 'it-IT')).toBe('24.08.2026');
  });
});

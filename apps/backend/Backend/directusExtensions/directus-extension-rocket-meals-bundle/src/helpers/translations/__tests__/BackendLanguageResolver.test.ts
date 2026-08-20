import { describe, expect, it, jest } from '@jest/globals';
import { DatabaseTypes, LanguageCodes, TranslationLanguage } from 'repo-depkit-common';

import { BackendLanguageResolver, LanguagesReadingDatabaseHelper } from '../BackendLanguageResolver';
import { BackendTranslationKeys } from '../BackendTranslationKeys';

/** What a customer typically has in the `languages` collection. */
const GERMAN_AND_ENGLISH: DatabaseTypes.Languages[] = [{ code: LanguageCodes.DE }, { code: LanguageCodes.EN }];

function buildDatabaseHelper(languages: DatabaseTypes.Languages[] | Error): {
  databaseHelper: LanguagesReadingDatabaseHelper;
  readByQuery: jest.Mock;
} {
  const readByQuery = jest.fn(async () => {
    if (languages instanceof Error) {
      throw languages;
    }
    return languages;
  });
  return {
    databaseHelper: { getLanguagesHelper: () => ({ readByQuery }) } as unknown as LanguagesReadingDatabaseHelper,
    readByQuery: readByQuery as unknown as jest.Mock,
  };
}

describe('BackendLanguageResolver.resolveWithAvailableLanguages', () => {
  it('keeps the exact code the languages table offers', () => {
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages(LanguageCodes.EN, GERMAN_AND_ENGLISH);

    expect(resolved.languageCode).toBe(LanguageCodes.EN);
    expect(resolved.translationLanguage).toBe(TranslationLanguage.EN);
  });

  it('matches case-insensitively', () => {
    expect(BackendLanguageResolver.resolveWithAvailableLanguages('DE-de', GERMAN_AND_ENGLISH).languageCode).toBe(LanguageCodes.DE);
  });

  it('upgrades a short code to the full code of the table', () => {
    // The app stores "en"; the database content is keyed by "en-US".
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages('en', GERMAN_AND_ENGLISH);

    expect(resolved.languageCode).toBe(LanguageCodes.EN);
    expect(resolved.translationLanguage).toBe(TranslationLanguage.EN);
  });

  it('matches a different region of the same language', () => {
    expect(BackendLanguageResolver.resolveWithAvailableLanguages('en-GB', GERMAN_AND_ENGLISH).languageCode).toBe(LanguageCodes.EN);
  });

  it('matches a code the table stores in a different case', () => {
    // `languages.code` is maintained by hand per customer, nothing enforces the casing.
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages('de-de', [{ code: 'DE-DE' }, { code: LanguageCodes.EN }]);

    expect(resolved.languageCode).toBe('DE-DE');
    expect(resolved.translationLanguage).toBe(TranslationLanguage.DE);
  });

  it('matches a language the apps ship no texts for, and still writes German texts', () => {
    // Italian content may exist in the database even though the catalogue has no Italian.
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages('it', [{ code: 'it-IT' }, { code: LanguageCodes.DE }]);

    expect(resolved.languageCode).toBe('it-IT');
    expect(resolved.translationLanguage).toBe(TranslationLanguage.DE);
  });

  it('reads the code out of an expanded languages relation', () => {
    expect(BackendLanguageResolver.resolveWithAvailableLanguages({ code: LanguageCodes.EN }, GERMAN_AND_ENGLISH).languageCode).toBe(LanguageCodes.EN);
  });

  it('falls back to German when the language is not in the table', () => {
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages('it-IT', GERMAN_AND_ENGLISH);

    expect(resolved.languageCode).toBe(LanguageCodes.DE);
    expect(resolved.translationLanguage).toBe(TranslationLanguage.DE);
  });

  it('falls back to English when the table has no German', () => {
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages('it-IT', [{ code: 'fr-FR' }, { code: LanguageCodes.EN }]);

    expect(resolved.languageCode).toBe(LanguageCodes.EN);
    expect(resolved.translationLanguage).toBe(TranslationLanguage.EN);
  });

  it('falls back to the first row when the table has neither German nor English', () => {
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages(undefined, [{ code: 'fr-FR' }, { code: 'tr-TR' }]);

    expect(resolved.languageCode).toBe('fr-FR');
    expect(resolved.translationLanguage).toBe(TranslationLanguage.FR);
  });

  it('keeps the profile value when the table is empty, and still renders German texts', () => {
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages('it-IT', []);

    expect(resolved.languageCode).toBe('it-IT');
    expect(resolved.translationLanguage).toBe(TranslationLanguage.DE);
  });

  it('ignores rows without a usable code', () => {
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages('en', [
      { code: '' } as DatabaseTypes.Languages,
      { code: '   ' } as DatabaseTypes.Languages,
      { code: LanguageCodes.EN },
    ]);

    expect(resolved.languageCode).toBe(LanguageCodes.EN);
  });

  it('hands out a translator bound to the resolved language', () => {
    const resolved = BackendLanguageResolver.resolveWithAvailableLanguages('en', GERMAN_AND_ENGLISH);

    expect(resolved.translate(BackendTranslationKeys.tomorrow)).toBe('Tomorrow');
  });
});

describe('BackendLanguageResolver against the database', () => {
  it('resolves the language of a profile', async () => {
    const { databaseHelper } = buildDatabaseHelper(GERMAN_AND_ENGLISH);
    const resolver = new BackendLanguageResolver(databaseHelper);

    const resolved = await resolver.resolveForProfile({ language: 'en' });

    expect(resolved.languageCode).toBe(LanguageCodes.EN);
    expect(resolved.translate(BackendTranslationKeys.today)).toBe('Today');
  });

  it('reads the languages collection only once', async () => {
    const { databaseHelper, readByQuery } = buildDatabaseHelper(GERMAN_AND_ENGLISH);
    const resolver = new BackendLanguageResolver(databaseHelper);

    await resolver.resolveForProfile({ language: 'en' });
    await resolver.resolveForProfile({ language: 'de' });
    await resolver.resolveForProfile({ language: null });

    expect(readByQuery).toHaveBeenCalledTimes(1);
  });

  it('falls back to German instead of failing when the collection cannot be read', async () => {
    const { databaseHelper } = buildDatabaseHelper(new Error('collection missing'));
    const resolver = new BackendLanguageResolver(databaseHelper);

    const resolved = await resolver.resolveForProfile({ language: 'en-US' });

    expect(resolved.translationLanguage).toBe(TranslationLanguage.EN);
    expect(await resolver.getAvailableLanguages()).toEqual([]);
  });

  it('resolves to German for a profile without a language', async () => {
    const { databaseHelper } = buildDatabaseHelper(GERMAN_AND_ENGLISH);
    const resolver = new BackendLanguageResolver(databaseHelper);

    expect((await resolver.resolveForProfile(undefined)).languageCode).toBe(LanguageCodes.DE);
    expect((await resolver.resolveForProfile({})).translationLanguage).toBe(TranslationLanguage.DE);
  });
});

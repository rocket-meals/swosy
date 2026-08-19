import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes, LanguageCodes } from 'repo-depkit-common';

import { NotifySchedule } from '../NotifySchedule';
import { WorkflowRunContext } from '../../helpers/WorkflowRunContext';
import { BackendLanguageResolver, BackendLanguageSource } from '../../helpers/translations';

/**
 * The notification texts are built without touching the database, so they can be checked
 * directly. Everything else in NotifySchedule needs a running Directus.
 */
const notifySchedule = new NotifySchedule(undefined as unknown as WorkflowRunContext);

/** What a customer typically has in the `languages` collection. */
const AVAILABLE_LANGUAGES: DatabaseTypes.Languages[] = [{ code: LanguageCodes.DE }, { code: LanguageCodes.EN }];

const DATE_IN_THREE_DAYS = new Date(Date.UTC(2026, 7, 24, 12, 0, 0));

function resolve(profileLanguage: BackendLanguageSource) {
  return BackendLanguageResolver.resolveWithAvailableLanguages(profileLanguage, AVAILABLE_LANGUAGES);
}

function buildFoodWithTranslations(translations: Record<string, string>): DatabaseTypes.Foods {
  return {
    translations: Object.entries(translations).map(([languages_code, name], index) => ({
      id: index + 1,
      languages_code,
      name,
    })),
  } as unknown as DatabaseTypes.Foods;
}

describe('NotifySchedule date wording', () => {
  it('says "Morgen" for a German profile', () => {
    expect(notifySchedule.getTranslationDate(resolve(LanguageCodes.DE), 1, DATE_IN_THREE_DAYS)).toBe('Morgen');
    expect(notifySchedule.getTranslationDate(resolve(LanguageCodes.DE), 0, DATE_IN_THREE_DAYS)).toBe('Heute');
  });

  it('says "Tomorrow" for an English profile', () => {
    expect(notifySchedule.getTranslationDate(resolve(LanguageCodes.EN), 1, DATE_IN_THREE_DAYS)).toBe('Tomorrow');
    expect(notifySchedule.getTranslationDate(resolve(LanguageCodes.EN), 0, DATE_IN_THREE_DAYS)).toBe('Today');
  });

  it('stays German when the profile has no language', () => {
    expect(notifySchedule.getTranslationDate(resolve(null), 1, DATE_IN_THREE_DAYS)).toBe('Morgen');
  });

  it('formats a date further out in the language of the profile', () => {
    expect(notifySchedule.getTranslationDate(resolve(LanguageCodes.DE), 3, DATE_IN_THREE_DAYS)).toBe('24.08.2026');
    expect(notifySchedule.getTranslationDate(resolve(LanguageCodes.EN), 3, DATE_IN_THREE_DAYS)).toBe('08/24/2026');
  });
});

describe('NotifySchedule meal name', () => {
  const food = buildFoodWithTranslations({
    [LanguageCodes.DE]: 'Lasagne',
    [LanguageCodes.EN]: 'Lasagna',
  });

  it('uses the translation of the profile language', () => {
    expect(notifySchedule.getFoodNameTranslation(food, resolve(LanguageCodes.EN))).toBe('Lasagna');
    expect(notifySchedule.getFoodNameTranslation(food, resolve(LanguageCodes.DE))).toBe('Lasagne');
  });

  it('finds the translation even when the profile only stores the short code', () => {
    // The app works with "en"; the food's translations are keyed by the table's "en-US".
    expect(notifySchedule.getFoodNameTranslation(food, resolve('en'))).toBe('Lasagna');
  });

  it('falls back to a translated placeholder when the meal has no name at all', () => {
    const namelessFood = buildFoodWithTranslations({});

    expect(notifySchedule.getFoodNameTranslation(namelessFood, resolve(LanguageCodes.DE))).toBe('ein Gericht');
    expect(notifySchedule.getFoodNameTranslation(namelessFood, resolve(LanguageCodes.EN))).toBe('a meal');
    expect(notifySchedule.getFoodNameTranslation(namelessFood, resolve(null))).toBe('ein Gericht');
  });
});

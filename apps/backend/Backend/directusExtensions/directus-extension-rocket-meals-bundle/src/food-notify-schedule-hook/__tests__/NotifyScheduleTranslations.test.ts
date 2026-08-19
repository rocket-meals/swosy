import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes, LanguageCodes } from 'repo-depkit-common';

import { NotifySchedule } from '../NotifySchedule';
import { WorkflowRunContext } from '../../helpers/WorkflowRunContext';

/**
 * The notification texts are built without touching the database, so they can be checked
 * directly. Everything else in NotifySchedule needs a running Directus.
 */
const notifySchedule = new NotifySchedule(undefined as unknown as WorkflowRunContext);

const DATE_IN_THREE_DAYS = new Date(Date.UTC(2026, 7, 24, 12, 0, 0));

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
    expect(notifySchedule.getTranslationDate(LanguageCodes.DE, 1, DATE_IN_THREE_DAYS)).toBe('Morgen');
    expect(notifySchedule.getTranslationDate(LanguageCodes.DE, 0, DATE_IN_THREE_DAYS)).toBe('Heute');
  });

  it('says "Tomorrow" for an English profile', () => {
    expect(notifySchedule.getTranslationDate(LanguageCodes.EN, 1, DATE_IN_THREE_DAYS)).toBe('Tomorrow');
    expect(notifySchedule.getTranslationDate(LanguageCodes.EN, 0, DATE_IN_THREE_DAYS)).toBe('Today');
  });

  it('stays German when the profile has no language', () => {
    expect(notifySchedule.getTranslationDate(null, 1, DATE_IN_THREE_DAYS)).toBe('Morgen');
  });

  it('formats a date further out in the language of the profile', () => {
    expect(notifySchedule.getTranslationDate(LanguageCodes.DE, 3, DATE_IN_THREE_DAYS)).toBe('24.08.2026');
    expect(notifySchedule.getTranslationDate(LanguageCodes.EN, 3, DATE_IN_THREE_DAYS)).toBe('08/24/2026');
  });
});

describe('NotifySchedule meal name', () => {
  const food = buildFoodWithTranslations({
    [LanguageCodes.DE]: 'Lasagne',
    [LanguageCodes.EN]: 'Lasagna',
  });

  it('uses the translation of the profile language', () => {
    expect(notifySchedule.getFoodNameTranslation(food, LanguageCodes.EN)).toBe('Lasagna');
    expect(notifySchedule.getFoodNameTranslation(food, LanguageCodes.DE)).toBe('Lasagne');
  });

  it('falls back to a translated placeholder when the meal has no name at all', () => {
    const namelessFood = buildFoodWithTranslations({});

    expect(notifySchedule.getFoodNameTranslation(namelessFood, LanguageCodes.DE)).toBe('ein Gericht');
    expect(notifySchedule.getFoodNameTranslation(namelessFood, LanguageCodes.EN)).toBe('a meal');
    expect(notifySchedule.getFoodNameTranslation(namelessFood, null)).toBe('ein Gericht');
  });
});

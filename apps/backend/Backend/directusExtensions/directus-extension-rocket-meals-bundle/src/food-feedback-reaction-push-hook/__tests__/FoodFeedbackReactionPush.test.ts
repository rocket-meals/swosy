import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes, FoodFeedbackReaction, FoodFeedbackReactionHelper, LanguageCodes } from 'repo-depkit-common';

import { FoodFeedbackReactionPush } from '../FoodFeedbackReactionPush';
import { BackendLanguageResolver, BackendLanguageSource, BackendTranslationKeys } from '../../helpers/translations';

const AVAILABLE_LANGUAGES: DatabaseTypes.Languages[] = [{ code: LanguageCodes.DE }, { code: LanguageCodes.EN }];

function resolve(profileLanguage: BackendLanguageSource) {
  return BackendLanguageResolver.resolveWithAvailableLanguages(profileLanguage, AVAILABLE_LANGUAGES);
}

const FOOD = {
  id: 'food-1',
  alias: 'Currywurst alias',
  translations: [
    { id: 1, languages_code: LanguageCodes.DE, name: 'Currywurst mit Pommes' },
    { id: 2, languages_code: LanguageCodes.EN, name: 'Curry sausage with fries' },
  ],
} as unknown as DatabaseTypes.Foods;

describe('FoodFeedbackReactionPush', () => {
  it('has an own text for every reaction offered in the module', () => {
    const keys = FoodFeedbackReactionHelper.REACTIONS.map(reaction => FoodFeedbackReactionPush.getBodyKey(reaction));
    expect(new Set(keys).size).toBe(FoodFeedbackReactionHelper.REACTIONS.length);
    expect(keys).not.toContain(BackendTranslationKeys.notification_food_feedback_reaction_other);
  });

  it('uses the general text for a reaction set by hand', () => {
    expect(FoodFeedbackReactionPush.getBodyKey('🤷')).toBe(BackendTranslationKeys.notification_food_feedback_reaction_other);
  });

  it('puts the food as title and the emoji with its text as body, in the language of the author', () => {
    expect(FoodFeedbackReactionPush.buildMessage({ support_reaction: FoodFeedbackReaction.THUMBS_UP, food: FOOD }, resolve(LanguageCodes.DE))).toEqual({
      title: 'Currywurst mit Pommes',
      body: '👍 Der Mensa gefällt dein Kommentar.',
    });
    expect(FoodFeedbackReactionPush.buildMessage({ support_reaction: FoodFeedbackReaction.YUMMY, food: FOOD }, resolve(LanguageCodes.EN))).toEqual({
      title: 'Curry sausage with fries',
      body: '😋 The canteen is glad you enjoyed it.',
    });
  });

  it('falls back to the alias and then to a general title when the food has no name', () => {
    const withoutTranslations = { ...FOOD, translations: [] } as unknown as DatabaseTypes.Foods;
    expect(FoodFeedbackReactionPush.buildMessage({ support_reaction: '👍', food: withoutTranslations }, resolve(LanguageCodes.DE))?.title).toBe('Currywurst alias');
    expect(FoodFeedbackReactionPush.buildMessage({ support_reaction: '👍', food: 'food-1' }, resolve(LanguageCodes.DE))?.title).toBe('Rückmeldung der Mensa');
  });

  it('sends nothing without a reaction', () => {
    expect(FoodFeedbackReactionPush.buildMessage({ support_reaction: null, food: FOOD }, resolve(LanguageCodes.DE))).toBeNull();
    expect(FoodFeedbackReactionPush.buildMessage({ support_reaction: ' ', food: FOOD }, resolve(LanguageCodes.DE))).toBeNull();
  });
});

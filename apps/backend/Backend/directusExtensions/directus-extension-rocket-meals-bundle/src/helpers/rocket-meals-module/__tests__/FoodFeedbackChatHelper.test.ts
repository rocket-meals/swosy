import { describe, expect, it } from '@jest/globals';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common';
import { FoodFeedbackChatHelper } from '../FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../RocketMealsModulePages';
import { AppExtensionLanguageHelper } from '../../app-extensions/AppExtensionLanguageHelper';
import { BackendTranslationKeys } from '../../translations/BackendTranslationKeys';

// The rules (status, filters, chat creation) are tested in repo-depkit-common; this covers the
// Directus side of the page: requests, presentation and texts.
describe('FoodFeedbackChatHelper', () => {
  describe('buildListQuery', () => {
    it('sorts newest first, pages, searches and uses the shared filter', () => {
      const query = FoodFeedbackChatHelper.buildListQuery(FoodFeedbackChatFilter.OPEN, 3, '  Pasta ');
      expect(query.sort).toBe('-date_created');
      expect(query.limit).toBe(FoodFeedbackChatHelper.PAGE_SIZE);
      expect(query.page).toBe(3);
      expect(query.search).toBe('Pasta');
      expect(query.meta).toBe('filter_count');
      expect(query.filter).toBe(JSON.stringify(FoodFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.OPEN)));
      expect(String(query.fields)).toContain('chat.conversation_state');
      expect(String(query.fields)).toContain('profile.language');
    });

    it('omits an empty search and clamps the page', () => {
      const query = FoodFeedbackChatHelper.buildListQuery(FoodFeedbackChatFilter.ALL, 0, '   ');
      expect(query.search).toBeUndefined();
      expect(query.page).toBe(1);
    });
  });

  it('counts with the shared filter', () => {
    expect(FoodFeedbackChatHelper.buildCountQuery(FoodFeedbackChatFilter.NEW)).toEqual({
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(FoodFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.NEW)),
    });
  });

  it('counts pages', () => {
    expect(FoodFeedbackChatHelper.getPageCount(0)).toBe(1);
    expect(FoodFeedbackChatHelper.getPageCount(25)).toBe(1);
    expect(FoodFeedbackChatHelper.getPageCount(26)).toBe(2);
  });

  it('has a label, icon and colour for every status and a label for every filter', () => {
    for (const status of Object.values(FoodFeedbackChatStatus)) {
      const presentation = FoodFeedbackChatHelper.getStatusPresentation(status);
      expect(AppExtensionLanguageHelper.translate(presentation.labelKey, 'de-DE').length).toBeGreaterThan(0);
      expect(presentation.icon.length).toBeGreaterThan(0);
      expect(presentation.color).toMatch(/^var\(--theme--/);
    }
    for (const filter of FoodFeedbackChatStatusHelper.FILTERS) {
      expect(AppExtensionLanguageHelper.translate(FoodFeedbackChatHelper.getFilterLabelKey(filter), 'de-DE').length).toBeGreaterThan(0);
    }
    expect(AppExtensionLanguageHelper.translate(FoodFeedbackChatHelper.getFilterLabelKey(FoodFeedbackChatFilter.WAITING_FOR_USER), 'de-DE')).toBe('Beantwortet');
  });

  it('shows food and canteen by alias, falling back to the id', () => {
    expect(FoodFeedbackChatHelper.getFoodName({ food: { id: '7', alias: 'Pasta' } })).toBe('Pasta');
    expect(FoodFeedbackChatHelper.getFoodName({ food: { id: '7', alias: null } })).toBe('7');
    expect(FoodFeedbackChatHelper.getFoodName({ food: null })).toBeUndefined();
    expect(FoodFeedbackChatHelper.getCanteenName({ canteen: { id: 'c', alias: 'Hauptmensa' } })).toBe('Hauptmensa');
  });

  it('writes the chat title in the language of the author', () => {
    expect(AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_food_feedback_chat_alias, 'de-DE', { food: 'Pasta' })).toBe('Feedback zu Pasta');
    expect(AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_food_feedback_chat_alias, 'en-US', { food: 'Pasta' })).toBe('Feedback on Pasta');
  });

  it('names the support author', () => {
    expect(FoodFeedbackChatHelper.getSupportAuthorName({ id: 'm', user_created: { id: 'u', first_name: 'Nils', last_name: 'B' } })).toBe('Nils B');
    expect(FoodFeedbackChatHelper.getSupportAuthorName({ id: 'm', user_created: { id: 'u', email: 'a@b.de' } })).toBe('a@b.de');
    expect(FoodFeedbackChatHelper.getSupportAuthorName({ id: 'm', user_created: 'u' })).toBeUndefined();
  });
});

describe('RocketMealsModulePages', () => {
  it('builds routes below the module', () => {
    expect(RocketMealsModulePages.getRoute()).toBe('/rocket-meals');
    expect(RocketMealsModulePages.getRoute(RocketMealsModulePages.FOOD_FEEDBACKS)).toBe('/rocket-meals/food-feedbacks');
    expect(RocketMealsModulePages.getRoute(RocketMealsModulePages.FOOD_FEEDBACKS, 'a b')).toBe('/rocket-meals/food-feedbacks/a%20b');
  });
});

describe('AppExtensionLanguageHelper.formatDateTime', () => {
  it('formats in the language of the user and ignores invalid dates', () => {
    expect(AppExtensionLanguageHelper.formatDateTime('2026-10-06T09:45:00Z', 'de-DE')).toContain('2026');
    expect(AppExtensionLanguageHelper.formatDateTime('not a date', 'de-DE')).toBe('');
    expect(AppExtensionLanguageHelper.formatDateTime(null, 'de-DE')).toBe('');
  });
});

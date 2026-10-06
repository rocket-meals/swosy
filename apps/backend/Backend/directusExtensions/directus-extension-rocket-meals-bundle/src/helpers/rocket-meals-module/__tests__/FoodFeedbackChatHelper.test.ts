import { describe, expect, it } from '@jest/globals';
import { ChatConversationState } from 'repo-depkit-common';
import { FoodFeedbackChatHelper, FoodFeedbackChatStatus, FoodFeedbackListFilter } from '../FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../RocketMealsModulePages';
import { AppExtensionLanguageHelper } from '../../app-extensions/AppExtensionLanguageHelper';
import { BackendTranslationKeys } from '../../translations/BackendTranslationKeys';

describe('FoodFeedbackChatHelper', () => {
  describe('getStatus', () => {
    it('is new without a chat', () => {
      expect(FoodFeedbackChatHelper.getStatus({ chat: null })).toBe(FoodFeedbackChatStatus.NEW);
    });

    it('follows the conversation state of the chat', () => {
      expect(FoodFeedbackChatHelper.getStatus({ chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_USER } })).toBe(FoodFeedbackChatStatus.WAITING_FOR_USER);
      expect(FoodFeedbackChatHelper.getStatus({ chat: { id: 'c', conversation_state: ChatConversationState.RESOLVED } })).toBe(FoodFeedbackChatStatus.RESOLVED);
      expect(FoodFeedbackChatHelper.getStatus({ chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_SUPPORT } })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
    });

    it('counts a chat without known state as waiting for support', () => {
      expect(FoodFeedbackChatHelper.getStatus({ chat: { id: 'c', conversation_state: null } })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
      expect(FoodFeedbackChatHelper.getStatus({ chat: 'chat-id' })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
    });
  });

  describe('buildFilter', () => {
    const hasComment = { comment: { _nempty: true } };

    it('always requires a comment', () => {
      for (const filter of FoodFeedbackChatHelper.FILTERS) {
        expect((FoodFeedbackChatHelper.buildFilter(filter)._and as unknown[])[0]).toEqual(hasComment);
      }
    });

    it('open means without chat or waiting for support', () => {
      expect(FoodFeedbackChatHelper.buildFilter(FoodFeedbackListFilter.OPEN)).toEqual({
        _and: [hasComment, { _or: [{ chat: { _null: true } }, { chat: { conversation_state: { _eq: 'waiting_for_support' } } }] }],
      });
    });

    it('filters single states', () => {
      expect(FoodFeedbackChatHelper.buildFilter(FoodFeedbackListFilter.NEW)).toEqual({ _and: [hasComment, { chat: { _null: true } }] });
      expect(FoodFeedbackChatHelper.buildFilter(FoodFeedbackListFilter.RESOLVED)).toEqual({
        _and: [hasComment, { chat: { conversation_state: { _eq: 'resolved' } } }],
      });
      expect(FoodFeedbackChatHelper.buildFilter(FoodFeedbackListFilter.ALL)).toEqual({ _and: [hasComment] });
    });
  });

  describe('buildListQuery', () => {
    it('sorts newest first, pages and searches', () => {
      const query = FoodFeedbackChatHelper.buildListQuery(FoodFeedbackListFilter.ALL, 3, '  Pasta ');
      expect(query.sort).toBe('-date_created');
      expect(query.limit).toBe(FoodFeedbackChatHelper.PAGE_SIZE);
      expect(query.page).toBe(3);
      expect(query.search).toBe('Pasta');
      expect(query.meta).toBe('filter_count');
      expect(String(query.fields)).toContain('chat.conversation_state');
    });

    it('omits an empty search and clamps the page', () => {
      const query = FoodFeedbackChatHelper.buildListQuery(FoodFeedbackListFilter.ALL, 0, '   ');
      expect(query.search).toBeUndefined();
      expect(query.page).toBe(1);
    });
  });

  it('counts pages', () => {
    expect(FoodFeedbackChatHelper.getPageCount(0)).toBe(1);
    expect(FoodFeedbackChatHelper.getPageCount(25)).toBe(1);
    expect(FoodFeedbackChatHelper.getPageCount(26)).toBe(2);
  });

  it('only allows a chat when there is a profile or already a chat', () => {
    expect(FoodFeedbackChatHelper.canStartChat({ profile: 'p', chat: null })).toBe(true);
    expect(FoodFeedbackChatHelper.canStartChat({ profile: null, chat: 'c' })).toBe(true);
    expect(FoodFeedbackChatHelper.canStartChat({ profile: null, chat: null })).toBe(false);
  });

  it('reads the language of the author in both shapes', () => {
    expect(FoodFeedbackChatHelper.getAuthorLanguage({ profile: { id: 'p', language: 'en-US' } })).toBe('en-US');
    expect(FoodFeedbackChatHelper.getAuthorLanguage({ profile: { id: 'p', language: { code: 'de-DE' } } })).toBe('de-DE');
    expect(FoodFeedbackChatHelper.getAuthorLanguage({ profile: 'p' })).toBeUndefined();
  });

  it('builds the chat for a feedback with the comment as initial message', () => {
    expect(FoodFeedbackChatHelper.buildChatForFeedback({ id: 'f', comment: '  Zu salzig  ' }, 'Feedback zu Pasta')).toEqual({
      alias: 'Feedback zu Pasta',
      initial_message: 'Zu salzig',
      conversation_state: ChatConversationState.WAITING_FOR_SUPPORT,
    });
  });

  it('writes the chat title in the language of the author', () => {
    expect(AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_food_feedback_chat_alias, 'de-DE', { food: 'Pasta' })).toBe('Feedback zu Pasta');
    expect(AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_food_feedback_chat_alias, 'en-US', { food: 'Pasta' })).toBe('Feedback on Pasta');
  });

  it('tells support messages from user messages by the profile', () => {
    expect(FoodFeedbackChatHelper.isMessageFromSupport({ id: 'm', profile: null })).toBe(true);
    expect(FoodFeedbackChatHelper.isMessageFromSupport({ id: 'm', profile: { id: 'p' } })).toBe(false);
  });

  it('names the support author', () => {
    expect(FoodFeedbackChatHelper.getSupportAuthorName({ id: 'm', user_created: { id: 'u', first_name: 'Nils', last_name: 'B' } })).toBe('Nils B');
    expect(FoodFeedbackChatHelper.getSupportAuthorName({ id: 'm', user_created: { id: 'u', email: 'a@b.de' } })).toBe('a@b.de');
    expect(FoodFeedbackChatHelper.getSupportAuthorName({ id: 'm', user_created: 'u' })).toBeUndefined();
  });

  it('sorts messages oldest first', () => {
    const sorted = FoodFeedbackChatHelper.sortMessages([
      { id: 'b', date_created: '2026-10-06T10:00:00Z' },
      { id: 'a', date_created: '2026-10-06T09:00:00Z' },
    ]);
    expect(sorted.map(message => message.id)).toEqual(['a', 'b']);
  });

  it('has a label for every filter', () => {
    for (const filter of FoodFeedbackChatHelper.FILTERS) {
      expect(AppExtensionLanguageHelper.translate(FoodFeedbackChatHelper.getFilterLabelKey(filter), 'de-DE').length).toBeGreaterThan(0);
    }
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

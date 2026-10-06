import { describe, expect, it } from '@jest/globals';
import { ChatConversationState } from '../ChatConversationState';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from '../FoodFeedbackChatStatusHelper';

describe('FoodFeedbackChatStatusHelper', () => {
  describe('getStatus', () => {
    it('is new without a chat', () => {
      expect(FoodFeedbackChatStatusHelper.getStatus({ chat: null })).toBe(FoodFeedbackChatStatus.NEW);
      expect(FoodFeedbackChatStatusHelper.getStatus({})).toBe(FoodFeedbackChatStatus.NEW);
    });

    it('follows the conversation state of the chat', () => {
      expect(FoodFeedbackChatStatusHelper.getStatus({ chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_USER } })).toBe(FoodFeedbackChatStatus.WAITING_FOR_USER);
      expect(FoodFeedbackChatStatusHelper.getStatus({ chat: { id: 'c', conversation_state: ChatConversationState.RESOLVED } })).toBe(FoodFeedbackChatStatus.RESOLVED);
      expect(FoodFeedbackChatStatusHelper.getStatus({ chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_SUPPORT } })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
    });

    it('counts a chat without known state as waiting for support', () => {
      expect(FoodFeedbackChatStatusHelper.getStatus({ chat: { id: 'c', conversation_state: null } })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
      expect(FoodFeedbackChatStatusHelper.getStatus({ chat: 'chat-id' })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
    });
  });

  it('uses the same values for status and chat state', () => {
    expect(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT as string).toBe(ChatConversationState.WAITING_FOR_SUPPORT);
    expect(FoodFeedbackChatStatus.WAITING_FOR_USER as string).toBe(ChatConversationState.WAITING_FOR_USER);
    expect(FoodFeedbackChatStatus.RESOLVED as string).toBe(ChatConversationState.RESOLVED);
  });

  describe('buildFilter', () => {
    const hasComment = { comment: { _nempty: true } };

    it('always requires a comment', () => {
      for (const filter of FoodFeedbackChatStatusHelper.FILTERS) {
        expect((FoodFeedbackChatStatusHelper.buildFilter(filter)._and as unknown[])[0]).toEqual(hasComment);
      }
    });

    it('open means without chat or waiting for support', () => {
      expect(FoodFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.OPEN)).toEqual({
        _and: [hasComment, { _or: [{ chat: { _null: true } }, { chat: { conversation_state: { _eq: 'waiting_for_support' } } }] }],
      });
    });

    it('filters single states', () => {
      expect(FoodFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.NEW)).toEqual({ _and: [hasComment, { chat: { _null: true } }] });
      expect(FoodFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.WAITING_FOR_USER)).toEqual({
        _and: [hasComment, { chat: { conversation_state: { _eq: 'waiting_for_user' } } }],
      });
      expect(FoodFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.RESOLVED)).toEqual({
        _and: [hasComment, { chat: { conversation_state: { _eq: 'resolved' } } }],
      });
      expect(FoodFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.ALL)).toEqual({ _and: [hasComment] });
    });
  });

  describe('matchesFilter', () => {
    const newFeedback = { comment: 'Zu salzig', chat: null };
    const waiting = { comment: 'Kalt', chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_SUPPORT } };
    const answered = { comment: 'Frage', chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_USER } };

    it('agrees with the status', () => {
      expect(FoodFeedbackChatStatusHelper.matchesFilter(newFeedback, FoodFeedbackChatFilter.OPEN)).toBe(true);
      expect(FoodFeedbackChatStatusHelper.matchesFilter(waiting, FoodFeedbackChatFilter.OPEN)).toBe(true);
      expect(FoodFeedbackChatStatusHelper.matchesFilter(answered, FoodFeedbackChatFilter.OPEN)).toBe(false);
      expect(FoodFeedbackChatStatusHelper.matchesFilter(answered, FoodFeedbackChatFilter.WAITING_FOR_USER)).toBe(true);
      expect(FoodFeedbackChatStatusHelper.matchesFilter(newFeedback, FoodFeedbackChatFilter.NEW)).toBe(true);
      expect(FoodFeedbackChatStatusHelper.matchesFilter(answered, FoodFeedbackChatFilter.ALL)).toBe(true);
    });

    it('never matches a feedback without comment', () => {
      expect(FoodFeedbackChatStatusHelper.matchesFilter({ comment: '   ', chat: null }, FoodFeedbackChatFilter.ALL)).toBe(false);
      expect(FoodFeedbackChatStatusHelper.hasComment({ comment: null })).toBe(false);
    });
  });

  it('only allows a chat when there is a profile or already a chat', () => {
    expect(FoodFeedbackChatStatusHelper.canStartChat({ profile: 'p', chat: null })).toBe(true);
    expect(FoodFeedbackChatStatusHelper.canStartChat({ profile: null, chat: 'c' })).toBe(true);
    expect(FoodFeedbackChatStatusHelper.canStartChat({ profile: null, chat: null })).toBe(false);
  });

  it('reads the language of the author in both shapes', () => {
    expect(FoodFeedbackChatStatusHelper.getAuthorLanguage({ profile: { id: 'p', language: 'en-US' } })).toBe('en-US');
    expect(FoodFeedbackChatStatusHelper.getAuthorLanguage({ profile: { id: 'p', language: { code: 'de-DE' } } })).toBe('de-DE');
    expect(FoodFeedbackChatStatusHelper.getAuthorLanguage({ profile: 'p' })).toBeUndefined();
  });

  it('builds the chat for a feedback with the comment as initial message', () => {
    expect(FoodFeedbackChatStatusHelper.buildChatForFeedback({ comment: '  Zu salzig  ' }, 'Feedback zu Pasta')).toEqual({
      alias: 'Feedback zu Pasta',
      initial_message: 'Zu salzig',
      conversation_state: ChatConversationState.WAITING_FOR_SUPPORT,
    });
  });
});

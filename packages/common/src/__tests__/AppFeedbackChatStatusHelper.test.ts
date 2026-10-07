import { describe, expect, it } from '@jest/globals';
import { AppFeedbackChatStatusHelper, AppFeedbackSourceFilter, AppFeedbackState } from '../AppFeedbackChatStatusHelper';
import { AppFeedbackContentHelper } from '../AppFeedbackContentHelper';
import { ChatConversationState } from '../ChatConversationState';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus } from '../FoodFeedbackChatStatusHelper';

describe('AppFeedbackChatStatusHelper', () => {
  it('reads the status from the chat like food feedbacks', () => {
    expect(AppFeedbackChatStatusHelper.getStatus({ chat: null })).toBe(FoodFeedbackChatStatus.NEW);
    expect(AppFeedbackChatStatusHelper.getStatus({ chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_USER } })).toBe(FoodFeedbackChatStatus.WAITING_FOR_USER);
    expect(AppFeedbackChatStatusHelper.getStatus({ chat: 'c', source_identifier: 'app' })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
  });

  it('reads the status of a store review from its store response', () => {
    expect(AppFeedbackChatStatusHelper.getStatus({ source_identifier: 'apple', response: null })).toBe(FoodFeedbackChatStatus.NEW);
    expect(AppFeedbackChatStatusHelper.getStatus({ source_identifier: 'google_play', response: '  ' })).toBe(FoodFeedbackChatStatus.NEW);
    expect(AppFeedbackChatStatusHelper.getStatus({ source_identifier: 'apple', response: 'Danke!' })).toBe(FoodFeedbackChatStatus.WAITING_FOR_USER);
  });

  it('counts a feedback without chat marked as closed as done', () => {
    expect(AppFeedbackChatStatusHelper.getStatus({ source_identifier: 'apple', response: null, state: AppFeedbackState.CLOSED })).toBe(FoodFeedbackChatStatus.RESOLVED);
    expect(AppFeedbackChatStatusHelper.getStatus({ source_identifier: 'apple', response: 'Danke!', state: AppFeedbackState.CLOSED })).toBe(FoodFeedbackChatStatus.RESOLVED);
    expect(AppFeedbackChatStatusHelper.getStatus({ chat: null, state: AppFeedbackState.CLOSED })).toBe(FoodFeedbackChatStatus.RESOLVED);
    expect(AppFeedbackChatStatusHelper.getStatus({ chat: null, state: AppFeedbackState.OPEN })).toBe(FoodFeedbackChatStatus.NEW);
    // A chat decides on its own.
    expect(AppFeedbackChatStatusHelper.getStatus({ chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_SUPPORT }, state: AppFeedbackState.CLOSED })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
    expect(AppFeedbackChatStatusHelper.getOpenStatus({ source_identifier: 'apple', response: 'Danke!' })).toBe(FoodFeedbackChatStatus.WAITING_FOR_USER);
  });

  it('keeps the status without chat only for store reviews and feedbacks without profile', () => {
    expect(AppFeedbackChatStatusHelper.isStatusWithoutChat({ source_identifier: 'apple' })).toBe(true);
    expect(AppFeedbackChatStatusHelper.isStatusWithoutChat({ profile: null, chat: null })).toBe(true);
    expect(AppFeedbackChatStatusHelper.isStatusWithoutChat({ profile: 'p', chat: null })).toBe(false);
    expect(AppFeedbackChatStatusHelper.isStatusWithoutChat({ profile: null, chat: 'c' })).toBe(false);
  });

  describe('buildFilter', () => {
    const storeReview = { source_identifier: { _in: ['apple', 'google_play'] } };
    const notStoreReview = { _or: [{ source_identifier: { _null: true } }, { source_identifier: { _nin: ['apple', 'google_play'] } }] };
    const notClosed = { _or: [{ state: { _null: true } }, { state: { _neq: 'closed' } }] };
    const newFeedback = { _and: [notClosed, { _or: [{ _and: [notStoreReview, { chat: { _null: true } }] }, { _and: [storeReview, { response: { _empty: true } }] }] }] };
    const inState = (state: ChatConversationState) => ({ chat: { conversation_state: { _eq: state } } });

    it('counts feedbacks without chat and unanswered store reviews as new', () => {
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.NEW)).toEqual(newFeedback);
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.OPEN)).toEqual({ _or: [newFeedback, inState(ChatConversationState.WAITING_FOR_SUPPORT)] });
    });

    it('counts answered store reviews as waiting for the user', () => {
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.WAITING_FOR_USER)).toEqual({
        _or: [inState(ChatConversationState.WAITING_FOR_USER), { _and: [storeReview, { response: { _nempty: true } }, notClosed] }],
      });
    });

    it('counts resolved chats and closed feedbacks without chat as done', () => {
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.RESOLVED)).toEqual({
        _or: [inState(ChatConversationState.RESOLVED), { _and: [{ chat: { _null: true } }, { state: { _eq: 'closed' } }] }],
      });
    });

    it('filters by chat state otherwise, without requiring a comment', () => {
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.WAITING_FOR_SUPPORT)).toEqual(inState(ChatConversationState.WAITING_FOR_SUPPORT));
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.ALL)).toBeUndefined();
    });

    it('matches in memory like the Directus filter', () => {
      const waiting = { chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_SUPPORT } };
      const answered = { chat: { id: 'c', conversation_state: ChatConversationState.WAITING_FOR_USER } };
      expect(AppFeedbackChatStatusHelper.matchesFilter({ chat: null }, FoodFeedbackChatFilter.OPEN)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter(waiting, FoodFeedbackChatFilter.OPEN)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter(answered, FoodFeedbackChatFilter.OPEN)).toBe(false);
      expect(AppFeedbackChatStatusHelper.matchesFilter(answered, FoodFeedbackChatFilter.WAITING_FOR_USER)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ source_identifier: 'apple', response: 'Danke' }, FoodFeedbackChatFilter.WAITING_FOR_USER)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ source_identifier: 'apple' }, FoodFeedbackChatFilter.OPEN)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter(answered, FoodFeedbackChatFilter.ALL)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ source_identifier: 'apple', state: 'closed' }, FoodFeedbackChatFilter.OPEN)).toBe(false);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ source_identifier: 'apple', state: 'closed' }, FoodFeedbackChatFilter.RESOLVED)).toBe(true);
    });
  });

  it('filters by source; in-app feedbacks may carry no source at all', () => {
    expect(AppFeedbackChatStatusHelper.buildSourceFilter(AppFeedbackSourceFilter.ALL)).toBeUndefined();
    expect(AppFeedbackChatStatusHelper.buildSourceFilter(null)).toBeUndefined();
    expect(AppFeedbackChatStatusHelper.buildSourceFilter(AppFeedbackSourceFilter.APP)).toEqual({ _or: [{ source_identifier: { _null: true } }, { source_identifier: { _eq: 'app' } }] });
    expect(AppFeedbackChatStatusHelper.buildSourceFilter(AppFeedbackSourceFilter.APPLE)).toEqual({ source_identifier: { _eq: 'apple' } });
    expect(AppFeedbackChatStatusHelper.buildSourceFilter(AppFeedbackSourceFilter.GOOGLE_PLAY)).toEqual({ source_identifier: { _eq: 'google_play' } });
  });

  it('recognises store reviews', () => {
    expect(AppFeedbackChatStatusHelper.isStoreReview({ source_identifier: 'apple' })).toBe(true);
    expect(AppFeedbackChatStatusHelper.isStoreReview({ source_identifier: 'google_play' })).toBe(true);
    expect(AppFeedbackChatStatusHelper.isStoreReview({ source_identifier: 'app' })).toBe(false);
    expect(AppFeedbackChatStatusHelper.isStoreReview({ source_identifier: null })).toBe(false);
  });

  it('can only start a chat with a profile or an existing chat', () => {
    expect(AppFeedbackChatStatusHelper.canStartChat({ profile: 'p', chat: null })).toBe(true);
    expect(AppFeedbackChatStatusHelper.canStartChat({ profile: null, chat: { id: 'c' } })).toBe(true);
    expect(AppFeedbackChatStatusHelper.canStartChat({ profile: null, chat: null })).toBe(false);
  });

  describe('chat', () => {
    it('titles the chat with the feedback title, else its id, cut to the column length', () => {
      expect(AppFeedbackChatStatusHelper.getChatAlias({ id: 'f1', title: '  Crash beim Start ' })).toBe('Feedback: Crash beim Start');
      expect(AppFeedbackChatStatusHelper.getChatAlias({ id: 'f1', title: '   ' })).toBe('Feedback: f1');
      expect(AppFeedbackChatStatusHelper.getChatAlias({ id: 'f1', title: 'x'.repeat(400) })).toHaveLength(AppFeedbackChatStatusHelper.CHAT_ALIAS_MAX_LENGTH);
    });

    it('opens the chat with title and content, without the legacy app state', () => {
      const content = `Bitte helfen\n${AppFeedbackContentHelper.APP_STATE_JSON_MARKER}{"a":1}`;
      expect(AppFeedbackChatStatusHelper.buildChatForFeedback({ id: 'f1', title: 'Crash', content })).toEqual({
        alias: 'Feedback: Crash',
        initial_message: `Title: Crash\nContent: ${AppFeedbackContentHelper.stripAppState(content)}`.trim(),
        conversation_state: ChatConversationState.WAITING_FOR_SUPPORT,
      });
    });
  });
});

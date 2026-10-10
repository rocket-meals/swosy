import { describe, expect, it } from '@jest/globals';
import { AppFeedbackChatStatusHelper, AppFeedbackSourceFilter, AppFeedbackState } from '../AppFeedbackChatStatusHelper';
import { AppFeedbackContentHelper } from '../AppFeedbackContentHelper';
import { ChatConversationState } from '../ChatConversationState';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus } from '../FoodFeedbackChatStatusHelper';

describe('AppFeedbackChatStatusHelper', () => {
  it('reads the status from app_feedbacks.state only, never from the chat', () => {
    expect(AppFeedbackChatStatusHelper.getStatus({ state: AppFeedbackState.OPEN })).toBe(FoodFeedbackChatStatus.NEW);
    expect(AppFeedbackChatStatusHelper.getStatus({ state: null })).toBe(FoodFeedbackChatStatus.NEW);
    expect(AppFeedbackChatStatusHelper.getStatus({ state: 'in_review' })).toBe(FoodFeedbackChatStatus.NEW);
    expect(AppFeedbackChatStatusHelper.getStatus({ state: AppFeedbackState.WAITING_FOR_SUPPORT })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
    expect(AppFeedbackChatStatusHelper.getStatus({ state: AppFeedbackState.WAITING_FOR_USER })).toBe(FoodFeedbackChatStatus.WAITING_FOR_USER);
    expect(AppFeedbackChatStatusHelper.getStatus({ state: AppFeedbackState.CLOSED })).toBe(FoodFeedbackChatStatus.RESOLVED);
  });

  it('ignores the store answer – only the state counts', () => {
    expect(AppFeedbackChatStatusHelper.getStatus({ state: AppFeedbackState.OPEN })).toBe(FoodFeedbackChatStatus.NEW);
    expect(AppFeedbackChatStatusHelper.matchesFilter({ state: null }, FoodFeedbackChatFilter.NEW)).toBe(true);
  });

  it('maps between status, app feedback state and chat state', () => {
    for (const status of [FoodFeedbackChatStatus.NEW, FoodFeedbackChatStatus.WAITING_FOR_SUPPORT, FoodFeedbackChatStatus.WAITING_FOR_USER, FoodFeedbackChatStatus.RESOLVED]) {
      expect(AppFeedbackChatStatusHelper.getStatus({ state: AppFeedbackChatStatusHelper.getStateForStatus(status) })).toBe(status);
    }
    for (const conversationState of [ChatConversationState.WAITING_FOR_SUPPORT, ChatConversationState.WAITING_FOR_USER, ChatConversationState.RESOLVED]) {
      const state = AppFeedbackChatStatusHelper.getStateForConversationState(conversationState);
      expect(AppFeedbackChatStatusHelper.getConversationStateForState(state)).toBe(conversationState);
    }
    expect(AppFeedbackChatStatusHelper.getStateForConversationState(null)).toBeUndefined();
    expect(AppFeedbackChatStatusHelper.getConversationStateForState(AppFeedbackState.OPEN)).toBeUndefined();
    expect(AppFeedbackChatStatusHelper.getConversationStateForState(null)).toBeUndefined();
  });

  it('knows which feedbacks have no chat and will not get one', () => {
    expect(AppFeedbackChatStatusHelper.isWithoutChat({ source_identifier: 'apple' })).toBe(true);
    expect(AppFeedbackChatStatusHelper.isWithoutChat({ profile: null, chat: null })).toBe(true);
    expect(AppFeedbackChatStatusHelper.isWithoutChat({ profile: 'p', chat: null })).toBe(false);
    expect(AppFeedbackChatStatusHelper.isWithoutChat({ profile: null, chat: 'c' })).toBe(false);
  });

  describe('buildFilter', () => {
    const open = { _or: [{ state: { _null: true } }, { state: { _nin: ['waiting_for_support', 'waiting_for_user', 'closed'] } }] };

    it('only filters on the state, never on the chat or the store answer', () => {
      for (const filter of AppFeedbackChatStatusHelper.FILTERS) {
        const json = JSON.stringify(AppFeedbackChatStatusHelper.buildFilter(filter) ?? {});
        expect(json).not.toContain('chat');
        expect(json).not.toContain('response');
      }
    });

    it('maps every filter to its state', () => {
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.NEW)).toEqual(open);
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.OPEN)).toEqual({ _or: [open, { state: { _eq: 'waiting_for_support' } }] });
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.WAITING_FOR_SUPPORT)).toEqual({ state: { _eq: 'waiting_for_support' } });
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.WAITING_FOR_USER)).toEqual({ state: { _eq: 'waiting_for_user' } });
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.RESOLVED)).toEqual({ state: { _eq: 'closed' } });
      expect(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.ALL)).toBeUndefined();
    });

    it('matches in memory like the Directus filter', () => {
      expect(AppFeedbackChatStatusHelper.matchesFilter({ state: null }, FoodFeedbackChatFilter.OPEN)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ state: 'waiting_for_support' }, FoodFeedbackChatFilter.OPEN)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ state: 'waiting_for_user' }, FoodFeedbackChatFilter.OPEN)).toBe(false);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ state: 'waiting_for_user' }, FoodFeedbackChatFilter.WAITING_FOR_USER)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ state: 'closed' }, FoodFeedbackChatFilter.OPEN)).toBe(false);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ state: 'closed' }, FoodFeedbackChatFilter.RESOLVED)).toBe(true);
      expect(AppFeedbackChatStatusHelper.matchesFilter({ state: 'closed' }, FoodFeedbackChatFilter.ALL)).toBe(true);
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

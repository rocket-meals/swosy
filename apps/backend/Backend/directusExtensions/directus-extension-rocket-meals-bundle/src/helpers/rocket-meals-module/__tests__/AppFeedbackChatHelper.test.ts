import { describe, expect, it } from '@jest/globals';
import { AppFeedbackChatStatusHelper, AppFeedbackSourceFilter, FoodFeedbackChatFilter } from 'repo-depkit-common';
import { AppFeedbackChatActions } from '../AppFeedbackChatActions';
import { AppFeedbackChatHelper, AppFeedbackTypeFilter } from '../AppFeedbackChatHelper';
import { FoodFeedbackChatHelper, FoodFeedbackListSort } from '../FoodFeedbackChatHelper';
import { AppExtensionLanguageHelper } from '../../app-extensions/AppExtensionLanguageHelper';
import { BackendTranslationKeys } from '../../translations/BackendTranslationKeys';

// The rules (status, filters, chat creation) are tested in repo-depkit-common; this covers the
// Directus side of the page "App-Feedbacks": requests, presentation and writes.
describe('AppFeedbackChatHelper', () => {
  describe('buildListQuery', () => {
    it('sorts newest first, pages, searches and uses the shared filter', () => {
      const query = AppFeedbackChatHelper.buildListQuery(FoodFeedbackChatFilter.OPEN, 2, '  Absturz ');
      expect(query.sort).toBe('-date_created');
      expect(query.limit).toBe(FoodFeedbackChatHelper.PAGE_SIZE);
      expect(query.page).toBe(2);
      expect(query.search).toBe('Absturz');
      expect(query.meta).toBe('filter_count');
      expect(query.filter).toBe(JSON.stringify(AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.OPEN)));
      expect(String(query.fields)).toContain('chat.conversation_state');
      expect(String(query.fields)).toContain('response');
    });

    it('omits an empty search, clamps the page and sorts oldest first on request', () => {
      const query = AppFeedbackChatHelper.buildListQuery(FoodFeedbackChatFilter.ALL, 0, '  ', { sort: FoodFeedbackListSort.OLDEST, pageSize: 50 });
      expect(query.search).toBeUndefined();
      expect(query.page).toBe(1);
      expect(query.sort).toBe('date_created');
      expect(query.limit).toBe(50);
      expect(query.filter).toBe('{}');
    });
  });

  it('combines status, source and thumbs up / down', () => {
    expect(AppFeedbackChatHelper.buildFilter(FoodFeedbackChatFilter.RESOLVED, { source: AppFeedbackSourceFilter.APPLE, type: AppFeedbackTypeFilter.NEGATIVE })).toEqual({
      _and: [AppFeedbackChatStatusHelper.buildFilter(FoodFeedbackChatFilter.RESOLVED), AppFeedbackChatStatusHelper.buildSourceFilter(AppFeedbackSourceFilter.APPLE), { positive: { _eq: false } }],
    });
    expect(AppFeedbackChatHelper.buildFilter(FoodFeedbackChatFilter.ALL, { type: AppFeedbackTypeFilter.POSITIVE })).toEqual({ positive: { _eq: true } });
  });

  it('counts with the same filter and search as the list', () => {
    expect(AppFeedbackChatHelper.buildCountQuery(FoodFeedbackChatFilter.NEW, { source: AppFeedbackSourceFilter.APP }, ' x ')).toEqual({
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(AppFeedbackChatHelper.buildFilter(FoodFeedbackChatFilter.NEW, { source: AppFeedbackSourceFilter.APP })),
      search: 'x',
    });
  });

  it('describes source, device, title and content', () => {
    expect(AppFeedbackChatHelper.getSourceLabelKey({ source_identifier: 'google_play' })).toBe(BackendTranslationKeys.rocket_meals_module_source_google_play);
    expect(AppFeedbackChatHelper.getSourceLabelKey({ source_identifier: null })).toBe(BackendTranslationKeys.rocket_meals_module_source_app);
    expect(AppFeedbackChatHelper.getDeviceDescription({ device_platform: 'ios', device_system_version: '18.1', device_brand: 'Apple' })).toBe('ios 18.1 · Apple');
    expect(AppFeedbackChatHelper.getDeviceDescription({})).toBeUndefined();
    expect(AppFeedbackChatHelper.getTitle({ title: '   ' })).toBeUndefined();
    expect(AppFeedbackChatHelper.getContent({ content: 'Hallo\n---APP_STATE_JSON---{"a":1}' })).toBe('Hallo');
    expect(AppFeedbackChatHelper.getTypeIcon({ positive: true })).toBe('thumb_up');
    expect(AppFeedbackChatHelper.getTypeIcon({ positive: 0 })).toBe('thumb_down');
    expect(AppFeedbackChatHelper.getTypeIcon({ positive: null })).toBeUndefined();
  });

  it('only marks open feedbacks with someone to answer as done – never store reviews', () => {
    expect(AppFeedbackChatHelper.canMarkResolved({ id: 'a', chat: { id: 'c', conversation_state: 'waiting_for_support' } })).toBe(true);
    expect(AppFeedbackChatHelper.canMarkResolved({ id: 'a', chat: { id: 'c', conversation_state: 'resolved' } })).toBe(false);
    expect(AppFeedbackChatHelper.canMarkResolved({ id: 'a', profile: 'p', chat: null })).toBe(true);
    expect(AppFeedbackChatHelper.canMarkResolved({ id: 'a', profile: null, chat: null })).toBe(false);
    expect(AppFeedbackChatHelper.canMarkResolved({ id: 'a', source_identifier: 'apple' })).toBe(false);
  });

  it('has a label for every filter in every UI language', () => {
    for (const source of AppFeedbackChatStatusHelper.SOURCE_FILTERS) {
      expect(AppExtensionLanguageHelper.translate(AppFeedbackChatHelper.getSourceFilterLabelKey(source), 'de-DE')).not.toBe(AppFeedbackChatHelper.getSourceFilterLabelKey(source));
    }
    for (const type of AppFeedbackChatHelper.TYPE_FILTERS) {
      expect(AppExtensionLanguageHelper.translate(AppFeedbackChatHelper.getTypeFilterLabelKey(type), 'en-US')).not.toBe(AppFeedbackChatHelper.getTypeFilterLabelKey(type));
    }
  });
});

describe('AppFeedbackChatActions', () => {
  function createApi() {
    const calls: { method: string; url: string; data: unknown }[] = [];
    let nextChatId = 100;
    const api = {
      post: async (url: string, data?: unknown) => {
        calls.push({ method: 'post', url, data });
        return { data: { data: { id: String(nextChatId++) } } };
      },
      patch: async (url: string, data?: unknown) => {
        calls.push({ method: 'patch', url, data });
        return { data: {} };
      },
    };
    return { api, calls };
  }

  it('creates a missing chat like the app-feedbacks-hook and links it', async () => {
    const { api, calls } = createApi();
    const chatId = await AppFeedbackChatActions.ensureChat(api, { id: 'f1', title: 'Crash', content: 'Beim Start', profile: { id: 'p1' }, chat: null });
    expect(chatId).toBe('100');
    expect(calls).toEqual([
      { method: 'post', url: FoodFeedbackChatHelper.CHATS_ENDPOINT, data: AppFeedbackChatStatusHelper.buildChatForFeedback({ id: 'f1', title: 'Crash', content: 'Beim Start' }) },
      { method: 'post', url: FoodFeedbackChatHelper.CHATS_PARTICIPANTS_ENDPOINT, data: { chats_id: '100', profiles_id: 'p1' } },
      { method: 'patch', url: `${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/f1`, data: { chat: '100' } },
    ]);
  });

  it('reuses an existing chat', async () => {
    const { api, calls } = createApi();
    expect(await AppFeedbackChatActions.ensureChat(api, { id: 'f1', chat: 'c1' })).toBe('c1');
    expect(calls).toEqual([]);
  });

  it('marks existing chats as done at once and reports feedbacks without profile', async () => {
    const { api, calls } = createApi();
    const result = await AppFeedbackChatActions.markResolved(api, [
      { id: 'f1', chat: { id: 'c1', conversation_state: 'waiting_for_support' } },
      { id: 'f2', profile: 'p2', chat: null },
      { id: 'f3', profile: null, chat: null },
    ]);
    expect(result.resolvedIds.sort()).toEqual(['f1', 'f2']);
    expect(result.failedIds).toEqual(['f3']);
    expect(calls[0]).toEqual({ method: 'patch', url: FoodFeedbackChatHelper.CHATS_ENDPOINT, data: { keys: ['c1'], data: { conversation_state: 'resolved' } } });
    expect(calls[calls.length - 1]).toEqual({ method: 'patch', url: `${FoodFeedbackChatHelper.CHATS_ENDPOINT}/100`, data: { conversation_state: 'resolved' } });
  });

  it('answers a store review via its response field', async () => {
    const { api, calls } = createApi();
    await AppFeedbackChatActions.setStoreResponse(api, { id: 'r1' }, 'Danke!');
    expect(calls).toEqual([{ method: 'patch', url: `${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/r1`, data: { response: 'Danke!' } }]);
  });
});

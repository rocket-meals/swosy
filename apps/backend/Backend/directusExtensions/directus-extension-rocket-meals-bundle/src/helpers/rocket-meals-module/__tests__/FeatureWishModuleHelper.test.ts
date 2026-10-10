import { describe, expect, it } from '@jest/globals';
import { FeatureWishHelper, FeatureWishProgress, FeatureWishStatus } from 'repo-depkit-common';
import { AppExtensionLanguageHelper } from '../../app-extensions/AppExtensionLanguageHelper';
import { BackendTranslationKeys } from '../../translations/BackendTranslationKeys';
import { ChatQueryHelper } from '../ChatQueryHelper';
import { FeatureWishModuleActions } from '../FeatureWishModuleActions';
import { FeatureWishListFilter, FeatureWishListSort, FeatureWishModuleHelper, type FeatureWishListItem } from '../FeatureWishModuleHelper';
import { ModuleListHelper } from '../ModuleListHelper';

type ApiCall = { method: string; url: string; data: unknown };

function createApi(options: { failPatch?: (url: string, data: unknown) => boolean } = {}) {
  const calls: ApiCall[] = [];
  const api = {
    post: async (url: string, data?: unknown) => {
      calls.push({ method: 'post', url, data });
      return { data: { data: { id: 'c9' } } };
    },
    patch: async (url: string, data?: unknown) => {
      calls.push({ method: 'patch', url, data });
      if (options.failPatch?.(url, data)) {
        throw new Error('patch failed');
      }
      return { data: {} };
    },
  };
  return { api, calls };
}

// The rules of the collection are tested in repo-depkit-common (FeatureWishHelper); this covers the
// Directus side of the page "Feature-Wünsche": requests, presentation and writes.
describe('FeatureWishModuleHelper', () => {
  describe('buildFilter', () => {
    it('lists the wishes in review by default statuses and never likes', () => {
      expect(FeatureWishModuleHelper.buildFilter(FeatureWishListFilter.IN_REVIEW)).toEqual({ status: { _in: FeatureWishHelper.IN_REVIEW_STATUSES } });
      expect(FeatureWishModuleHelper.buildFilter(FeatureWishListFilter.ALL)).toEqual({ status: { _neq: FeatureWishStatus.LIKE } });
      expect(FeatureWishModuleHelper.buildFilter(FeatureWishListFilter.MERGED)).toEqual({ status: { _eq: FeatureWishStatus.MERGED } });
    });

    it('adds the ticked progresses, ignoring unknown ones and all of them ticked', () => {
      expect(FeatureWishModuleHelper.buildFilter(FeatureWishListFilter.PUBLISHED, { progresses: [FeatureWishProgress.RELEASED, 'nonsense' as FeatureWishProgress, FeatureWishProgress.PLANNED] })).toEqual({
        _and: [{ status: { _eq: FeatureWishStatus.PUBLISHED } }, { progress: { _in: [FeatureWishProgress.PLANNED, FeatureWishProgress.RELEASED] } }],
      });
      expect(FeatureWishModuleHelper.buildFilter(FeatureWishListFilter.PUBLISHED, { progresses: [...FeatureWishModuleHelper.PROGRESSES] })).toEqual({ status: { _eq: FeatureWishStatus.PUBLISHED } });
    });
  });

  describe('buildListQuery', () => {
    it('sorts newest first, pages and searches', () => {
      const query = FeatureWishModuleHelper.buildListQuery(FeatureWishListFilter.IN_REVIEW, 2, '  Dark Mode ');
      expect(query.sort).toBe('-date_created');
      expect(query.limit).toBe(ModuleListHelper.PAGE_SIZE);
      expect(query.page).toBe(2);
      expect(query.search).toBe('Dark Mode');
      expect(query.meta).toBe('filter_count');
      expect(String(query.fields)).toContain('moderation_note_intern');
      expect(String(query.fields)).toContain('related_to.title');
      expect(String(query.fields)).toContain('profile.language');
    });

    it('sorts by likes on request and omits an empty search', () => {
      const query = FeatureWishModuleHelper.buildListQuery(FeatureWishListFilter.ALL, 0, ' ', { sort: FeatureWishListSort.MOST_LIKES, pageSize: 50 });
      expect(query.sort).toBe('-likes_amount,-date_created');
      expect(query.page).toBe(1);
      expect(query.limit).toBe(50);
      expect(query.search).toBeUndefined();
    });

    it('counts with the same filter as the list', () => {
      const query = FeatureWishModuleHelper.buildCountQuery(FeatureWishListFilter.ARCHIVED, {}, 'x');
      expect(JSON.parse(query.aggregate!)).toEqual({ count: ['id'] });
      expect(JSON.parse(query.filter!)).toEqual({ status: { _eq: FeatureWishStatus.ARCHIVED } });
      expect(query.search).toBe('x');
    });
  });

  it('offers only other published wishes as originals', () => {
    expect(JSON.parse(FeatureWishModuleHelper.buildMergeTargetsQuery('w1').filter)).toEqual({ _and: [{ status: { _eq: FeatureWishStatus.PUBLISHED } }, { id: { _neq: 'w1' } }] });
    expect(JSON.parse(FeatureWishModuleHelper.buildDuplicatesQuery('w1').filter)).toEqual({ _and: [{ related_to: { _eq: 'w1' } }, { status: { _eq: FeatureWishStatus.MERGED } }] });
  });

  describe('suggestions', () => {
    it('maps every AI suggestion to the status a human gives it', () => {
      expect(FeatureWishModuleHelper.getSuggestion({ status: FeatureWishStatus.AI_SUGGESTS_PUBLISH })?.acceptStatus).toBe(FeatureWishStatus.PUBLISHED);
      expect(FeatureWishModuleHelper.getSuggestion({ status: FeatureWishStatus.AI_SUGGESTS_DECLINE })?.acceptStatus).toBe(FeatureWishStatus.ARCHIVED);
      expect(FeatureWishModuleHelper.getSuggestion({ status: FeatureWishStatus.AI_SUGGESTS_MERGE })?.acceptStatus).toBe(FeatureWishStatus.MERGED);
      expect(FeatureWishModuleHelper.getSuggestion({ status: FeatureWishStatus.DRAFT })).toBeUndefined();
    });

    it('takes over a merge only with its original', () => {
      expect(FeatureWishModuleHelper.canAcceptSuggestion({ status: FeatureWishStatus.AI_SUGGESTS_MERGE, related_to: null })).toBe(false);
      expect(FeatureWishModuleHelper.canAcceptSuggestion({ status: FeatureWishStatus.AI_SUGGESTS_MERGE, related_to: { id: 'w2', title: 'Original' } })).toBe(true);
      expect(FeatureWishModuleHelper.canAcceptSuggestion({ status: FeatureWishStatus.PUBLISHED })).toBe(false);
    });
  });

  it('has a translated label for every status, progress, filter and sort', () => {
    const keys = [...Object.values(FeatureWishStatus).map(status => FeatureWishModuleHelper.getStatusPresentation(status).labelKey), ...FeatureWishModuleHelper.PROGRESSES.map(progress => FeatureWishModuleHelper.getProgressPresentation(progress)!.labelKey), ...FeatureWishModuleHelper.FILTERS.map(filter => FeatureWishModuleHelper.getFilterLabelKey(filter)), ...FeatureWishModuleHelper.SORTS.map(sort => FeatureWishModuleHelper.getSortLabelKey(sort))];
    keys.forEach(key => expect(AppExtensionLanguageHelper.translate(key, 'de-DE')).not.toBe(key));
    expect(FeatureWishModuleHelper.getProgressPresentation(null)).toBeUndefined();
  });

  it('counts the author as first like and knows who can be written to', () => {
    expect(FeatureWishModuleHelper.getLikes({ likes_amount: null })).toBe(1);
    expect(FeatureWishModuleHelper.getLikes({ likes_amount: 4 })).toBe(4);
    expect(FeatureWishModuleHelper.canChat({ profile: null, chat: null })).toBe(false);
    expect(FeatureWishModuleHelper.canChat({ profile: 'p1', chat: null })).toBe(true);
    expect(FeatureWishModuleHelper.canPublish({ status: FeatureWishStatus.PUBLISHED })).toBe(false);
    expect(FeatureWishModuleHelper.canArchive({ status: FeatureWishStatus.ARCHIVED })).toBe(false);
  });
});

describe('FeatureWishModuleActions', () => {
  const wish = (id: string, status: FeatureWishStatus, relatedTo: string | null = null): FeatureWishListItem => ({ id, status, related_to: relatedTo ? { id: relatedTo } : null });

  it('sets a status on several wishes in one request', async () => {
    const { api, calls } = createApi();
    const result = await FeatureWishModuleActions.setStatus(api, [{ id: 'w1' }, { id: 'w2' }], FeatureWishStatus.PUBLISHED);
    expect(result).toEqual({ updatedIds: ['w1', 'w2'], failedIds: [] });
    expect(calls).toEqual([{ method: 'patch', url: FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT, data: { keys: ['w1', 'w2'], data: { status: FeatureWishStatus.PUBLISHED } } }]);
  });

  it('takes over the suggestions: grouped publish and archive, a merge with its original', async () => {
    const { api, calls } = createApi();
    const result = await FeatureWishModuleActions.acceptSuggestions(api, [wish('w1', FeatureWishStatus.AI_SUGGESTS_PUBLISH), wish('w2', FeatureWishStatus.AI_SUGGESTS_DECLINE), wish('w3', FeatureWishStatus.AI_SUGGESTS_MERGE, 'w9'), wish('w4', FeatureWishStatus.AI_SUGGESTS_PUBLISH), wish('w5', FeatureWishStatus.DRAFT)]);
    expect(result.updatedIds.sort()).toEqual(['w1', 'w2', 'w3', 'w4']);
    expect(result.failedIds).toEqual(['w5']);
    expect(calls).toContainEqual({ method: 'patch', url: FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT, data: { keys: ['w1', 'w4'], data: { status: FeatureWishStatus.PUBLISHED } } });
    expect(calls).toContainEqual({ method: 'patch', url: FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT, data: { keys: ['w2'], data: { status: FeatureWishStatus.ARCHIVED } } });
    expect(calls).toContainEqual({ method: 'patch', url: `${FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT}/w3`, data: { status: FeatureWishStatus.MERGED, related_to: 'w9' } });
  });

  it('reports a failed request', async () => {
    const { api } = createApi({ failPatch: () => true });
    expect(await FeatureWishModuleActions.setStatus(api, [{ id: 'w1' }], FeatureWishStatus.ARCHIVED)).toEqual({ updatedIds: [], failedIds: ['w1'] });
  });

  it('never merges a wish into itself', async () => {
    const { api } = createApi();
    await expect(FeatureWishModuleActions.merge(api, { id: 'w1' }, 'w1')).rejects.toThrow();
  });

  it('clears empty notes', async () => {
    const { api, calls } = createApi();
    const saved = await FeatureWishModuleActions.setNotes(api, { id: 'w1' }, { public: '  Kommt im Sommer ', intern: '  ' });
    expect(saved).toEqual({ moderation_note_public: 'Kommt im Sommer', moderation_note_intern: null });
    expect(calls[0]!.data).toEqual(saved);
  });

  it('creates the chat with the first message, in the language of the author', async () => {
    const { api, calls } = createApi();
    const chatId = await FeatureWishModuleActions.sendMessage(api, { id: 'w1', title: 'Dark Mode', description: 'Bitte', profile: { id: 'p1', language: 'en-US' }, chat: null }, 'Hello');
    expect(chatId).toBe('c9');
    expect(calls.map(call => `${call.method} ${call.url}`)).toEqual([`post ${ChatQueryHelper.CHATS_ENDPOINT}`, `post ${ChatQueryHelper.CHATS_PARTICIPANTS_ENDPOINT}`, `patch ${FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT}/w1`, `post ${ChatQueryHelper.CHAT_MESSAGES_ENDPOINT}`, `patch ${ChatQueryHelper.CHATS_ENDPOINT}/c9`]);
    expect(calls[0]!.data).toMatchObject({ alias: 'Your feature wish: Dark Mode', initial_message: 'Dark Mode\n\nBitte' });
    expect(calls[1]!.data).toEqual({ chats_id: 'c9', profiles_id: 'p1' });
    expect(calls[2]!.data).toEqual({ chat: 'c9' });
    expect(calls[4]!.data).toEqual({ conversation_state: 'waiting_for_user' });
    expect(AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_feature_wish_chat_alias, 'de-DE', { title: 'Dark Mode' })).toBe('Dein Feature-Wunsch: Dark Mode');
  });

  it('writes into an existing chat without creating one', async () => {
    const { api, calls } = createApi();
    await FeatureWishModuleActions.sendMessage(api, { id: 'w1', profile: 'p1', chat: { id: 'c1' } }, 'Hallo');
    expect(calls.map(call => `${call.method} ${call.url}`)).toEqual([`post ${ChatQueryHelper.CHAT_MESSAGES_ENDPOINT}`, `patch ${ChatQueryHelper.CHATS_ENDPOINT}/c1`]);
  });

  it('cannot write to a wish without account', async () => {
    const { api } = createApi();
    await expect(FeatureWishModuleActions.sendMessage(api, { id: 'w1', profile: null, chat: null }, 'Hallo')).rejects.toThrow();
  });
});

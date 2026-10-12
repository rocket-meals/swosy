import { describe, expect, it, jest } from '@jest/globals';
import { ChatQueryHelper } from '../ChatQueryHelper';
import { ModuleDeleteActions, type ModuleDeleteApiClient } from '../ModuleDeleteActions';

// Deleting on the pages of the module: items in one request, then their chats with participants.

const ENDPOINT = '/items/foods_feedbacks';

function createApi(failOn?: string) {
  const calls: { url: string; data: unknown }[] = [];
  const api: ModuleDeleteApiClient = {
    delete: jest.fn(async (url: string, config?: { data?: unknown }) => {
      calls.push({ url, data: config?.data });
      if (url === failOn) {
        throw new Error('forbidden');
      }
      return {};
    }),
  };
  return { api, calls };
}

describe('ModuleDeleteActions', () => {
  it('reads the chat ids of expanded and plain relations once each', () => {
    expect(ModuleDeleteActions.getChatIds([{ id: '1', chat: { id: 'c1' } }, { id: '2', chat: 'c1' }, { id: '3', chat: null }, { id: '4' }])).toEqual(['c1']);
  });

  it('deletes the items, then the participants and the chats', async () => {
    const { api, calls } = createApi();
    const result = await ModuleDeleteActions.deleteItems(api, ENDPOINT, [{ id: '1', chat: { id: 'c1' } }, { id: '2' }]);
    expect(result).toEqual({ deletedIds: ['1', '2'], failedIds: [] });
    expect(calls).toEqual([
      { url: ENDPOINT, data: ['1', '2'] },
      { url: ChatQueryHelper.CHATS_PARTICIPANTS_ENDPOINT, data: { query: { filter: { chats_id: { _in: ['c1'] } } } } },
      { url: ChatQueryHelper.CHATS_ENDPOINT, data: ['c1'] },
    ]);
  });

  it('touches no chat when the items cannot be deleted', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { api, calls } = createApi(ENDPOINT);
    expect(await ModuleDeleteActions.deleteItems(api, ENDPOINT, [{ id: '1', chat: 'c1' }])).toEqual({ deletedIds: [], failedIds: ['1'] });
    expect(calls).toHaveLength(1);
  });

  it('still reports the items as deleted when only their chat fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { api } = createApi(ChatQueryHelper.CHATS_ENDPOINT);
    expect(await ModuleDeleteActions.deleteItems(api, ENDPOINT, [{ id: '1', chat: 'c1' }])).toEqual({ deletedIds: ['1'], failedIds: [] });
  });

  it('deletes chats directly and sends nothing without ids', async () => {
    const { api, calls } = createApi();
    expect(await ModuleDeleteActions.deleteChats(api, ['c1', 'c2'])).toEqual({ deletedIds: ['c1', 'c2'], failedIds: [] });
    expect(await ModuleDeleteActions.deleteItems(api, ENDPOINT, [])).toEqual({ deletedIds: [], failedIds: [] });
    expect(calls).toHaveLength(2);
  });
});

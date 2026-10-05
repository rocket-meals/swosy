import { describe, expect, it, jest } from '@jest/globals';
import { UpsertHandler, UpsertItemsService } from '../UpsertHandler';

function createService(existing: Record<string, any>[]) {
  const service = {
    readByQuery: jest.fn(async () => existing),
    createOne: jest.fn(async () => 'new-id'),
    updateOne: jest.fn(async (key: string | number) => key),
  };
  return service as typeof service & UpsertItemsService;
}

describe('UpsertHandler', () => {
  it('converts plain values to _eq and keeps operator objects', () => {
    expect(UpsertHandler.toDirectusFilter({ key: 'a', count: 3, deleted: null, alias: { _in: ['x'] } })).toEqual({
      _and: [{ key: { _eq: 'a' } }, { count: { _eq: 3 } }, { deleted: { _null: true } }, { alias: { _in: ['x'] } }],
    });
  });

  it('rejects a missing or empty filter without touching the service', async () => {
    const service = createService([]);
    expect(await UpsertHandler.upsert(service, 'id', { body: { key: 'a' } })).toMatchObject({ success: false, code: 400 });
    expect(await UpsertHandler.upsert(service, 'id', undefined)).toMatchObject({ success: false, code: 400 });
    expect(service.readByQuery).not.toHaveBeenCalled();
    expect(service.createOne).not.toHaveBeenCalled();
  });

  it('creates the item when nothing matches', async () => {
    const service = createService([]);
    const result = await UpsertHandler.upsert(service, 'id', { filter: { key: 'a' }, body: { key: 'a', value: 1 } });
    expect(service.readByQuery).toHaveBeenCalledWith({ filter: { _and: [{ key: { _eq: 'a' } }] }, fields: ['id'], limit: 1 });
    expect(service.createOne).toHaveBeenCalledWith({ key: 'a', value: 1 });
    expect(service.updateOne).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, msg: 'Create Success', code: 201, data: { id: 'new-id' } });
  });

  it('updates the matching item using the primary key field', async () => {
    const service = createService([{ uuid: 'existing-id' }]);
    const result = await UpsertHandler.upsert(service, 'uuid', { filter: { key: 'a' }, body: { value: 2 } });
    expect(service.updateOne).toHaveBeenCalledWith('existing-id', { value: 2 });
    expect(service.createOne).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, msg: 'Update Success', code: 200, data: { id: 'existing-id' } });
  });
});

describe('UpsertHandler.upsertByFilter', () => {
  it('reports whether the item was created or updated', async () => {
    expect(await UpsertHandler.upsertByFilter(createService([]), 'id', { key: 'a' }, { key: 'a' })).toEqual({ id: 'new-id', created: true });
    expect(await UpsertHandler.upsertByFilter(createService([{ id: 7 }]), 'id', { key: 'a' }, { value: 1 })).toEqual({ id: 7, created: false });
  });

  it('refuses an empty filter instead of updating an arbitrary item', async () => {
    const service = createService([{ id: 7 }]);
    await expect(UpsertHandler.upsertByFilter(service, 'id', {}, { value: 1 })).rejects.toThrow();
    expect(service.updateOne).not.toHaveBeenCalled();
  });
});

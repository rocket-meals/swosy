import { describe, expect, it } from '@jest/globals';
import { DeletePermissionHelper } from '../DeletePermissionHelper';
import { ApiContext } from '../ApiContext';
import { MyEventContext } from '../MyDatabaseHelper';

function createApiContext(deletableKeys: string[], calls: string[] = []): ApiContext {
  class FakePermissionsService {
    async getItemPermissions(collection: string, primaryKey: string) {
      calls.push(collection + ':' + primaryKey);
      if (primaryKey === 'throws') {
        throw new Error('Forbidden');
      }
      return { delete: { access: deletableKeys.includes(primaryKey) } };
    }
  }
  return {
    services: { PermissionsService: FakePermissionsService },
    database: {},
    getSchema: async () => ({}),
  } as unknown as ApiContext;
}

function eventContextFor(accountability: any): MyEventContext {
  return { accountability, database: {}, schema: {} } as unknown as MyEventContext;
}

describe('DeletePermissionHelper.canDeleteAll', () => {
  it('allows internal calls without accountability without asking Directus', async () => {
    const calls: string[] = [];
    const allowed = await DeletePermissionHelper.canDeleteAll(createApiContext([], calls), eventContextFor(null), 'directus_users', ['a']);
    expect(allowed).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it('allows admins', async () => {
    const allowed = await DeletePermissionHelper.canDeleteAll(createApiContext([]), eventContextFor({ user: 'admin', admin: true }), 'directus_users', ['a']);
    expect(allowed).toBe(true);
  });

  it('denies public accountability without user', async () => {
    const allowed = await DeletePermissionHelper.canDeleteAll(createApiContext(['a']), eventContextFor({ user: null, admin: false }), 'directus_users', ['a']);
    expect(allowed).toBe(false);
  });

  it('allows a user only if every key may be deleted', async () => {
    const calls: string[] = [];
    const apiContext = createApiContext(['own'], calls);
    const user = eventContextFor({ user: 'u1', admin: false });

    expect(await DeletePermissionHelper.canDeleteAll(apiContext, user, 'directus_users', ['own'])).toBe(true);
    expect(await DeletePermissionHelper.canDeleteAll(apiContext, user, 'directus_users', ['own', 'other'])).toBe(false);
    expect(calls).toEqual(['directus_users:own', 'directus_users:own', 'directus_users:other']);
  });

  it('denies when Directus throws while checking', async () => {
    const allowed = await DeletePermissionHelper.canDeleteAll(createApiContext([]), eventContextFor({ user: 'u1', admin: false }), 'foods_feedbacks', ['throws']);
    expect(allowed).toBe(false);
  });
});

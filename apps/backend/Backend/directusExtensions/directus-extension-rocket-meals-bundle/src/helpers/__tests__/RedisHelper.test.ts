import { MemoryKeyValueStore, RedisHelper, RedisKeyValueStore } from '../RedisHelper';

describe('RedisHelper', () => {
  it('reads REDIS from the env', () => {
    expect(RedisHelper.getRedisUrl({ REDIS: 'redis://rocket-meals-cache:6379' })).toBe('redis://rocket-meals-cache:6379');
    expect(RedisHelper.getRedisUrl({ REDIS: '' })).toBeNull();
    expect(RedisHelper.getRedisUrl({})).toBeNull();
    expect(RedisHelper.getRedisUrl(undefined)).toBeNull();
  });

  it('falls back to memory without REDIS', () => {
    expect(RedisHelper.getRedisStore({})).toBeNull();
    expect(RedisHelper.getStore({})).toBeInstanceOf(MemoryKeyValueStore);
  });
});

describe('MemoryKeyValueStore', () => {
  it('expires values after their ttl', async () => {
    let now = 0;
    const store = new MemoryKeyValueStore(() => now);
    await store.set('a', '1', 1_000);
    expect(await store.get('a')).toBe('1');
    now = 999;
    expect(await store.get('a')).toBe('1');
    now = 1_000;
    expect(await store.get('a')).toBeNull();
  });

  it('sets only absent keys with setIfAbsent', async () => {
    let now = 0;
    const store = new MemoryKeyValueStore(() => now);
    expect(await store.setIfAbsent('a', '1', 1_000)).toBe(true);
    expect(await store.setIfAbsent('a', '2', 1_000)).toBe(false);
    expect(await store.get('a')).toBe('1');
    now = 1_000;
    expect(await store.setIfAbsent('a', '3', 1_000)).toBe(true);
  });

  it('deletes keys and forgets expired entries', async () => {
    let now = 0;
    const store = new MemoryKeyValueStore(() => now);
    await store.set('a', '1', 1_000);
    await store.set('b', '2', 1_000);
    await store.del('a');
    expect(await store.get('a')).toBeNull();
    now = 5_000;
    await store.set('c', '3', 1_000);
    expect(store.size).toBe(1);
  });
});

describe('RedisKeyValueStore', () => {
  it('maps to SET PX, SET PX NX, GET and DEL', async () => {
    const calls: unknown[][] = [];
    const client = {
      set: async (...args: unknown[]) => {
        calls.push(['set', ...args]);
        return args.includes('NX') ? null : 'OK';
      },
      get: async (key: string) => (key === 'a' ? '1' : null),
      del: async (...args: unknown[]) => {
        calls.push(['del', ...args]);
        return 1;
      },
    };
    const store = new RedisKeyValueStore(client as never);
    await store.set('a', '1', 500);
    expect(await store.setIfAbsent('a', '2', 500)).toBe(false);
    expect(await store.get('a')).toBe('1');
    await store.del('a', 'b');
    await store.del();
    expect(calls).toEqual([
      ['set', 'a', '1', 'PX', 500],
      ['set', 'a', '2', 'PX', 500, 'NX'],
      ['del', ['a', 'b']],
    ]);
  });
});

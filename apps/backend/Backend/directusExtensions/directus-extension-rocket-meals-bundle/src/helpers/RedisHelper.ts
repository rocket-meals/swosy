/**
 * RedisHelper.ts – a small key-value store with expiry, shared by all Directus replicas via Redis.
 *
 * Everything that has to hold across replicas (`DIRECTUS_REPLICAS`) – PKCE login state, the lock
 * against double-counted usage events – goes through `KeyValueStore`. With `REDIS` set it is Redis,
 * the same instance Directus uses for cache and synchronisation. Without it an in-memory store per
 * process takes over, which is enough for a single instance and for tests. `SharedStore` picks one.
 */

import Redis from 'ioredis';

/** A value to store under a key for `ttlMs` milliseconds. */
export type KeyValueEntry = {
  key: string;
  value: string;
  ttlMs: number;
};

export interface KeyValueStore {
  /** Stores the entry, replacing an existing value of its key. */
  set(entry: KeyValueEntry): Promise<void>;
  /**
   * Stores the entry only when its key is free and returns `true` then. Atomic in Redis (`SET … NX`),
   * so of several replicas asking at the same time exactly one gets `true`.
   */
  setIfAbsent(entry: KeyValueEntry): Promise<boolean>;
  get(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<void>;
}

/** The commands of an ioredis client the store needs. */
export type RedisClientLike = Pick<Redis, 'set' | 'get' | 'del'>;

export class RedisKeyValueStore implements KeyValueStore {
  constructor(private readonly client: RedisClientLike) {}

  async set(entry: KeyValueEntry): Promise<void> {
    await this.client.set(entry.key, entry.value, 'PX', entry.ttlMs);
  }

  async setIfAbsent(entry: KeyValueEntry): Promise<boolean> {
    return (await this.client.set(entry.key, entry.value, 'PX', entry.ttlMs, 'NX')) === 'OK';
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.client.get(key));
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}

export class MemoryKeyValueStore implements KeyValueStore {
  private readonly entries = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  set(entry: KeyValueEntry): Promise<void> {
    this.removeExpired();
    this.entries.set(entry.key, { value: entry.value, expiresAt: this.now() + entry.ttlMs });
    return Promise.resolve();
  }

  async setIfAbsent(entry: KeyValueEntry): Promise<boolean> {
    if ((await this.get(entry.key)) !== null) {
      return false;
    }
    await this.set(entry);
    return true;
  }

  get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) {
      return Promise.resolve(null);
    }
    if (this.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.value);
  }

  del(...keys: string[]): Promise<void> {
    for (const key of keys) {
      this.entries.delete(key);
    }
    return Promise.resolve();
  }

  get size(): number {
    return this.entries.size;
  }

  private removeExpired() {
    const now = this.now();
    for (const [key, entry] of this.entries) {
      if (now >= entry.expiresAt) {
        this.entries.delete(key);
      }
    }
  }
}

export class RedisHelper {
  /** One connection per URL and process, shared by all hooks and endpoints of the bundle. */
  private static readonly clients = new Map<string, Redis>();

  /** `REDIS` from the Directus env, e.g. `redis://rocket-meals-cache:6379`, or `null` when not set. */
  static getRedisUrl(env: Record<string, unknown> | null | undefined): string | null {
    const redisUrl = env?.['REDIS'];
    return typeof redisUrl === 'string' && redisUrl.length > 0 ? redisUrl : null;
  }

  static getClient(redisUrl: string): Redis {
    let client = RedisHelper.clients.get(redisUrl);
    if (!client) {
      client = new Redis(redisUrl);
      RedisHelper.clients.set(redisUrl, client);
    }
    return client;
  }
}

/**
 * The store to use: Redis when `REDIS` is set, so the values hold across all replicas, else memory
 * of this process (single instance, local development, tests).
 */
export class SharedStore implements KeyValueStore {
  private readonly store: KeyValueStore;

  constructor(env: Record<string, unknown> | null | undefined) {
    const redisUrl = RedisHelper.getRedisUrl(env);
    this.store = redisUrl ? new RedisKeyValueStore(RedisHelper.getClient(redisUrl)) : new MemoryKeyValueStore();
  }

  get usesRedis(): boolean {
    return this.store instanceof RedisKeyValueStore;
  }

  set(entry: KeyValueEntry): Promise<void> {
    return this.store.set(entry);
  }

  setIfAbsent(entry: KeyValueEntry): Promise<boolean> {
    return this.store.setIfAbsent(entry);
  }

  get(key: string): Promise<string | null> {
    return this.store.get(key);
  }

  del(...keys: string[]): Promise<void> {
    return this.store.del(...keys);
  }
}

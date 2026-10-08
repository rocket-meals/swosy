/**
 * RedisHelper.ts – a small key-value store with expiry, shared by all Directus replicas via Redis.
 *
 * Everything that has to hold across replicas (`DIRECTUS_REPLICAS`) – PKCE login state, the lock
 * against double-counted usage events – goes through `KeyValueStore`. With `REDIS` set it is Redis,
 * the same instance Directus uses for cache and synchronisation. Without it an in-memory store per
 * process takes over, which is enough for a single instance and for tests. `SharedStore` picks one.
 */

import Redis from 'ioredis';

export interface KeyValueStore {
  /** Stores `value` under `key` for `ttlMs` milliseconds, replacing an existing value. */
  set(key: string, value: string, ttlMs: number): Promise<void>;
  /**
   * Stores `value` only when `key` is free and returns `true` then. Atomic in Redis (`SET … NX`),
   * so of several replicas asking at the same time exactly one gets `true`.
   */
  setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<void>;
}

/** The commands of an ioredis client the store needs. */
export type RedisClientLike = Pick<Redis, 'set' | 'get' | 'del'>;

export class RedisKeyValueStore implements KeyValueStore {
  constructor(private readonly client: RedisClientLike) {}

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    await this.client.set(key, value, 'PX', ttlMs);
  }

  async setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    return (await this.client.set(key, value, 'PX', ttlMs, 'NX')) === 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
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

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    this.removeExpired();
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  async setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    if ((await this.get(key)) !== null) {
      return false;
    }
    await this.set(key, value, ttlMs);
    return true;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }
    if (this.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(...keys: string[]): Promise<void> {
    for (const key of keys) {
      this.entries.delete(key);
    }
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

  set(key: string, value: string, ttlMs: number): Promise<void> {
    return this.store.set(key, value, ttlMs);
  }

  setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    return this.store.setIfAbsent(key, value, ttlMs);
  }

  get(key: string): Promise<string | null> {
    return this.store.get(key);
  }

  del(...keys: string[]): Promise<void> {
    return this.store.del(...keys);
  }
}

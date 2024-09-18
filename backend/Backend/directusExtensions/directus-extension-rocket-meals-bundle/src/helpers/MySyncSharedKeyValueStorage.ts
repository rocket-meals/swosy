import Redis from 'ioredis';
//import {createKv, KvLocal, KvRedis} from '@directus/memory'; // results a jest error - TODO check in the future if it is fixed

interface Kv {
	get<T = unknown>(key: string): Promise<T | undefined>;
	set<T = unknown>(key: string, value: T): Promise<void>;
	delete(key: string): Promise<void>;
}

class KvLocal implements Kv {
	private cache: Record<string, any> = {};

	async get<T = unknown>(key: string): Promise<T | undefined> {
		return this.cache[key];
	}

	async set<T = unknown>(key: string, value: T): Promise<void> {
		this.cache[key] = value;
	}

	async delete(key: string): Promise<void> {
		delete this.cache[key];
	}
}

export interface MyKvStorageImplementation {
	set(key: string, value: string): Promise<"OK">
	get(key: string): Promise<string | null>
	del(...args: string[]): Promise<number>
	acquireLock(key: string, value: string, retryDelayMs?: number, maxRetries?: number): Promise<boolean>
	releaseLock(key: string): Promise<number>
}

class MyKvStorageRedis implements MyKvStorageImplementation{
	private durationInSeconds: number
	private redis: Redis
	constructor(redisUrl: string, duration: number) {
		this.durationInSeconds = duration;
		this.redis = new Redis(redisUrl); // Assumes env.REDIS is set to "redis://rocket-meals-cache:6379"
	}

	del(...args: string[]): Promise<number> {
		return this.redis.del(args);
	}

	get(key: string): Promise<string | null> {
		return this.redis.get(key);
	}

	set(key: string, value: string): Promise<"OK"> {
		return this.redis.set(key, value, 'EX', this.durationInSeconds);
	}

	async acquireLock(key: string, value: string, retryDelayMs = 100, maxRetries = 10): Promise<boolean> {
		for (let i = 0; i < maxRetries; i++) {
			const result = await this.redis.set(key, value, 'EX', this.durationInSeconds, 'NX');

			if (result === 'OK') {
				return true; // Lock acquired
			}

			// Wait before retrying
			await new Promise(resolve => setTimeout(resolve, retryDelayMs));
		}

		return false; // Failed to acquire lock after max retries
	}

	async releaseLock(key: string): Promise<number> {
		return this.redis.del(key);
	}

}

class MyKvStorageMemory implements MyKvStorageImplementation {
	private cache: Kv;
	private durationInSeconds: number;

	constructor(duration: number) {
		this.durationInSeconds = duration;
		this.cache = new KvLocal();
	}

	async del(...args: string[]): Promise<number> {
		let amountDeleted = 0;
		for (let arg of args) {
			await this.cache.delete(arg);
			amountDeleted++;
		}
		return amountDeleted;
	}

	async get(key: string): Promise<string | null> {
		const cachedItem = await this.cache.get<{ value: string; expiration: number }>(key);

		if (!cachedItem) {
			return null; // Key not found or value is null
		}

		const { value, expiration } = cachedItem;
		const currentTime = Date.now();

		if (currentTime > expiration) {
			// If the current time is past the expiration, remove the item and return null
			await this.cache.delete(key);
			return null;
		}

		return value; // Return the value if it has not expired
	}

	async set(key: string, value: string): Promise<"OK"> {
		const expiration = Date.now() + this.durationInSeconds * 1000; // Calculate expiration time in milliseconds
		const item = { value, expiration }; // Create an object with value and expiration
		await this.cache.set(key, item); // Store the object in the cache
		return "OK";
	}

	async acquireLock(key: string, value: string, retryDelayMs = 100, maxRetries = 10): Promise<boolean> {
		for (let i = 0; i < maxRetries; i++) {
			const cachedItem = await this.cache.get<{ value: string; expiration: number }>(key);

			// If no cached item or the lock has expired, acquire the lock
			if (!cachedItem || Date.now() > cachedItem.expiration) {
				const expiration = Date.now() + this.durationInSeconds * 1000; // Set expiration for the lock
				await this.cache.set(key, { value, expiration }); // Set the lock with an expiration
				return true; // Lock acquired
			}

			// Wait before retrying if lock is still active
			await new Promise(resolve => setTimeout(resolve, retryDelayMs));
		}

		return false; // Failed to acquire lock after max retries
	}

	async releaseLock(key: string): Promise<number> {
		return this.del(key)// Release the lock by deleting the key
	}
}

export class MySyncSharedKeyValueStorage implements MyKvStorageImplementation {
	private kvStorage: MyKvStorageImplementation;
	private storage_key_prefix: string;
	private retryDelayMs: number;
	private maxRetries: number;

	constructor(env?: Record<string, string> | NodeJS.ProcessEnv, durationInSeconds?: number, storage_key_prefix?: string, retryDelayMs = 100, maxRetries = 10) {
		this.storage_key_prefix = storage_key_prefix || "sync_shared_kv:";
		this.retryDelayMs = retryDelayMs;
		this.maxRetries = maxRetries;

		const usedEnv = env || process.env;
		const redisUrl = usedEnv?.["REDIS"];
		let usedRedisUrl = null;
		if(!!redisUrl && redisUrl.length > 0) {
			usedRedisUrl = redisUrl;
		}
		const usedDurationInSeconds = durationInSeconds || 300;
		this.kvStorage = redisUrl ? new MyKvStorageRedis(redisUrl, usedDurationInSeconds) : new MyKvStorageMemory(usedDurationInSeconds);
	}

	async del(...args: string[]): Promise<number> {
		let argsWithPrefix = args.map((arg) => this.storage_key_prefix + arg);
		return this.kvStorage.del(...argsWithPrefix);
	}

	async get(key: string): Promise<string | null> {
		return this.kvStorage.get(this.storage_key_prefix+key);
	}

	async set(key: string, value: string): Promise<"OK"> {
		return this.kvStorage.set(this.storage_key_prefix+key, value);
	}

	async acquireLock(key: string, value: string): Promise<boolean> {
		return this.kvStorage.acquireLock(this.storage_key_prefix+key, value, this.retryDelayMs, this.maxRetries);
	}

	async releaseLock(key: string): Promise<number> {
		return this.kvStorage.releaseLock(this.storage_key_prefix+key);
	}

}
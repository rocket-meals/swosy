// Both mocks below store their data in a plain object at *test-file* module scope, not
// inside the module registry that jest.resetModules() clears - this lets tests simulate
// "app relaunch" (a fresh sqliteStorage.ts module instance, i.e. a fresh in-memory
// dbPromise) against data that survives like it would on real disk, the same way
// AsyncStorage and the sqlite db file both survive a real app relaunch.
const sqliteRows: Record<string, string> = {};
const asyncStorageRows: Record<string, string> = {};

// Set to a key name to make the *next* attempted INSERT for that key silently no-op, once -
// simulates a transient/partial write failure so tests can verify that the migration only
// marks itself "verified" (and stops retrying) once a copy has actually been confirmed to
// have landed correctly.
let failNextWriteForKey: string | null = null;

function applySql(sql: string, key?: string, value?: string) {
	if (sql.startsWith('INSERT')) {
		if (key !== undefined) {
			if (key === failNextWriteForKey) {
				failNextWriteForKey = null;
				return;
			}
			sqliteRows[key] = value as string;
		}
	} else if (sql.startsWith('DELETE FROM kv WHERE')) {
		if (key !== undefined) delete sqliteRows[key];
	} else if (sql.startsWith('DELETE FROM kv')) {
		Object.keys(sqliteRows).forEach((k) => delete sqliteRows[k]);
	}
}

jest.mock('expo-sqlite', () => ({
	openDatabaseAsync: jest.fn(async () => ({
		execAsync: jest.fn(async (sql: string) => applySql(sql)),
		runAsync: jest.fn(async (sql: string, key?: string, value?: string) => applySql(sql, key, value)),
		getFirstAsync: jest.fn(async (sql: string, key: string) => (key in sqliteRows ? { value: sqliteRows[key] } : null)),
		getAllAsync: jest.fn(async () => Object.entries(sqliteRows).map(([key, value]) => ({ key, value }))),
		withExclusiveTransactionAsync: jest.fn(async (task: (txn: any) => Promise<void>) => {
			await task({ runAsync: jest.fn(async (sql: string, key?: string, value?: string) => applySql(sql, key, value)) });
		}),
	})),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (key: string) => (key in asyncStorageRows ? asyncStorageRows[key] : null)),
		setItem: jest.fn(async (key: string, value: string) => {
			asyncStorageRows[key] = value;
		}),
		removeItem: jest.fn(async (key: string) => {
			delete asyncStorageRows[key];
		}),
		getAllKeys: jest.fn(async () => Object.keys(asyncStorageRows)),
		multiGet: jest.fn(async (keys: string[]) => keys.map((key) => [key, key in asyncStorageRows ? asyncStorageRows[key] : null])),
		multiRemove: jest.fn(async (keys: string[]) => {
			keys.forEach((key) => delete asyncStorageRows[key]);
		}),
		clear: jest.fn(async () => {
			Object.keys(asyncStorageRows).forEach((key) => delete asyncStorageRows[key]);
		}),
	},
}));

describe('sqliteStorage', () => {
	beforeEach(() => {
		Object.keys(sqliteRows).forEach((key) => delete sqliteRows[key]);
		Object.keys(asyncStorageRows).forEach((key) => delete asyncStorageRows[key]);
		failNextWriteForKey = null;
		jest.resetModules();
	});

	it('returns null for a key that exists nowhere', async () => {
		const { sqliteStorage } = await import('./sqliteStorage');
		expect(await sqliteStorage.getItem('missing')).toBeNull();
	});

	it('migrates every legacy AsyncStorage key into sqlite on first boot, without deleting AsyncStorage', async () => {
		asyncStorageRows['persist:root'] = '{"a":1}';
		asyncStorageRows['auth_data'] = '{"token":"xyz"}';
		asyncStorageRows['selected_customer_enum'] = 'test';

		const { sqliteKeyValueStorage } = await import('./sqliteStorage');

		expect(await sqliteKeyValueStorage.getItem('persist:root')).toBe('{"a":1}');
		expect(await sqliteKeyValueStorage.getItem('auth_data')).toBe('{"token":"xyz"}');
		expect(await sqliteKeyValueStorage.getItem('selected_customer_enum')).toBe('test');
		expect(asyncStorageRows['persist:root']).toBe('{"a":1}');
		expect(asyncStorageRows['auth_data']).toBe('{"token":"xyz"}');
		expect(asyncStorageRows['selected_customer_enum']).toBe('test');
	});

	it('retries on the next boot if the previous boot never verified successfully, self-healing a bad run', async () => {
		// sqliteRows has stale/wrong data and, crucially, no "verified" sentinel - as if a
		// previous boot copied it wrong and (correctly, per the fix below) never marked
		// itself done. A fresh boot must retry and overwrite it with the real value.
		sqliteRows['persist:root'] = '{"a":"poisoned-by-a-previous-buggy-boot"}';
		asyncStorageRows['persist:root'] = '{"a":"real"}';

		const { sqliteKeyValueStorage } = await import('./sqliteStorage');
		expect(await sqliteKeyValueStorage.getItem('persist:root')).toBe('{"a":"real"}');
	});

	it('does not mark the migration verified if a write silently fails, and retries next boot', async () => {
		// Regression coverage for the bug INSERT OR IGNORE caused: a copy that doesn't
		// actually land must not be trusted just because nothing threw.
		asyncStorageRows['flaky_key'] = '"value"';
		failNextWriteForKey = 'flaky_key';

		const { sqliteKeyValueStorage: firstBoot } = await import('./sqliteStorage');
		expect(await firstBoot.getItem('flaky_key')).toBeNull(); // the simulated failed write

		jest.resetModules();
		const { sqliteKeyValueStorage: secondBoot } = await import('./sqliteStorage');
		expect(await secondBoot.getItem('flaky_key')).toBe('"value"'); // retried, and this time nothing failed
	});

	it('does NOT overwrite a newer sqlite write with AsyncStorage once the migration is verified', async () => {
		// Regression test for a real incident: without a "verified, stop repeating" gate,
		// the copy re-ran unconditionally on every boot. Since AsyncStorage is kept around
		// as a frozen snapshot (never updated again after migration), that meant every
		// restart silently reverted any value the app had since written via setItem() back
		// to whatever AsyncStorage happened to have at the very first migration - the app
		// could never actually "live" in sqlite afterwards.
		asyncStorageRows['foo'] = '"old-value-from-async-storage"';

		const { sqliteKeyValueStorage: firstBoot } = await import('./sqliteStorage');
		expect(await firstBoot.getItem('foo')).toBe('"old-value-from-async-storage"'); // migrated + verified this boot

		await firstBoot.setItem('foo', '"new-value-written-after-migration"');

		jest.resetModules();
		const { sqliteKeyValueStorage: secondBoot } = await import('./sqliteStorage');
		expect(await secondBoot.getItem('foo')).toBe('"new-value-written-after-migration"');
	});

	it('setItem/removeItem/multiRemove/clear operate directly on sqlite', async () => {
		const { sqliteKeyValueStorage } = await import('./sqliteStorage');

		await sqliteKeyValueStorage.setItem('foo', 'bar');
		expect(await sqliteKeyValueStorage.getItem('foo')).toBe('bar');

		await sqliteKeyValueStorage.removeItem('foo');
		expect(await sqliteKeyValueStorage.getItem('foo')).toBeNull();

		await sqliteKeyValueStorage.setItem('a', '1');
		await sqliteKeyValueStorage.setItem('b', '2');
		await sqliteKeyValueStorage.multiRemove(['a', 'b']);
		expect(await sqliteKeyValueStorage.getItem('a')).toBeNull();
		expect(await sqliteKeyValueStorage.getItem('b')).toBeNull();

		await sqliteKeyValueStorage.setItem('c', '3');
		await sqliteKeyValueStorage.clear();
		expect(await sqliteKeyValueStorage.getItem('c')).toBeNull();
	});

	it('the redux-persist Storage adapter (sqliteStorage) reads migrated data too', async () => {
		asyncStorageRows['persist:root'] = '{"a":1}';
		const { sqliteStorage } = await import('./sqliteStorage');
		expect(await sqliteStorage.getItem('persist:root')).toBe('{"a":1}');
	});

	it('migrateAsyncStorageToSqlite() (the debug "Daten migrieren" button) can be re-run manually any time', async () => {
		const { sqliteKeyValueStorage, migrateAsyncStorageToSqlite } = await import('./sqliteStorage');
		await sqliteKeyValueStorage.getItem('anything'); // forces the db (and the boot-time migration) open

		// Something left a key in AsyncStorage after boot already ran the automatic copy
		// (e.g. a setting changed while offline via code that still writes AsyncStorage).
		asyncStorageRows['leftover_key'] = '"still here"';

		const result = await migrateAsyncStorageToSqlite();
		expect(result.migratedKeys).toContain('leftover_key');
		expect(await sqliteKeyValueStorage.getItem('leftover_key')).toBe('"still here"');

		// AsyncStorage is kept as a safety net for now - re-running again should still
		// report the same key, not an empty list.
		const secondResult = await migrateAsyncStorageToSqlite();
		expect(secondResult.migratedKeys).toContain('leftover_key');
	});
});

// Both mocks below store their data in a plain object at *test-file* module scope, not
// inside the module registry that jest.resetModules() clears - this lets tests simulate
// "app relaunch" (a fresh sqliteStorage.ts module instance, i.e. a fresh in-memory
// dbPromise) against data that survives like it would on real disk, the same way
// AsyncStorage and the sqlite db file both survive a real app relaunch.
const mockSqliteRows: Record<string, string> = {};
const mockAsyncStorageRows: Record<string, string> = {};

// Set to a key name to make the *next* attempted INSERT for that key silently no-op, once -
// simulates a transient/partial write failure so tests can verify that the migration only
// marks itself "verified" (and stops retrying) once a copy has actually been confirmed to
// have landed correctly.
let mockFailNextWriteForKey: string | null = null;

function mockApplySql(sql: string, key?: string, value?: string) {
	if (sql.startsWith('INSERT')) {
		if (key !== undefined) {
			if (key === mockFailNextWriteForKey) {
				mockFailNextWriteForKey = null;
				return;
			}
			mockSqliteRows[key] = value as string;
		}
	} else if (sql.startsWith('DELETE FROM kv WHERE')) {
		if (key !== undefined) delete mockSqliteRows[key];
	} else if (sql.startsWith('DELETE FROM kv')) {
		Object.keys(mockSqliteRows).forEach((k) => delete mockSqliteRows[k]);
	}
}

// sqliteStorage.ts gets its db via repo-depkit-common-ui's getKvDatabase; the barrel of
// that package also re-exports UI components (WebView, bottom-sheet, ...), which cannot be
// loaded in the jest environment - so the whole package is mocked with just the db factory.
jest.mock('repo-depkit-common-ui', () => ({
	getKvDatabase: jest.fn(async () => ({
		execAsync: jest.fn(async (sql: string) => mockApplySql(sql)),
		runAsync: jest.fn(async (sql: string, key?: string, value?: string) => mockApplySql(sql, key, value)),
		getFirstAsync: jest.fn(async (sql: string, key: string) => (key in mockSqliteRows ? { value: mockSqliteRows[key] } : null)),
		getAllAsync: jest.fn(async () => Object.entries(mockSqliteRows).map(([key, value]) => ({ key, value }))),
		withExclusiveTransactionAsync: jest.fn(async (task: (txn: any) => Promise<void>) => {
			await task({ runAsync: jest.fn(async (sql: string, key?: string, value?: string) => mockApplySql(sql, key, value)) });
		}),
	})),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (key: string) => (key in mockAsyncStorageRows ? mockAsyncStorageRows[key] : null)),
		setItem: jest.fn(async (key: string, value: string) => {
			mockAsyncStorageRows[key] = value;
		}),
		removeItem: jest.fn(async (key: string) => {
			delete mockAsyncStorageRows[key];
		}),
		getAllKeys: jest.fn(async () => Object.keys(mockAsyncStorageRows)),
		multiGet: jest.fn(async (keys: string[]) => keys.map((key) => [key, key in mockAsyncStorageRows ? mockAsyncStorageRows[key] : null])),
		multiRemove: jest.fn(async (keys: string[]) => {
			keys.forEach((key) => delete mockAsyncStorageRows[key]);
		}),
		clear: jest.fn(async () => {
			Object.keys(mockAsyncStorageRows).forEach((key) => delete mockAsyncStorageRows[key]);
		}),
	},
}));

describe('sqliteStorage', () => {
	beforeEach(() => {
		Object.keys(mockSqliteRows).forEach((key) => delete mockSqliteRows[key]);
		Object.keys(mockAsyncStorageRows).forEach((key) => delete mockAsyncStorageRows[key]);
		mockFailNextWriteForKey = null;
		jest.resetModules();
	});

	it('returns null for a key that exists nowhere', async () => {
		const { sqliteStorage } = require('./sqliteStorage');
		expect(await sqliteStorage.getItem('missing')).toBeNull();
	});

	it('migrates every legacy AsyncStorage key into sqlite on first boot, without deleting AsyncStorage', async () => {
		mockAsyncStorageRows['persist:root'] = '{"a":1}';
		mockAsyncStorageRows['auth_data'] = '{"token":"xyz"}';
		mockAsyncStorageRows['selected_customer_enum'] = 'test';

		const { sqliteKeyValueStorage } = require('./sqliteStorage');

		expect(await sqliteKeyValueStorage.getItem('persist:root')).toBe('{"a":1}');
		expect(await sqliteKeyValueStorage.getItem('auth_data')).toBe('{"token":"xyz"}');
		expect(await sqliteKeyValueStorage.getItem('selected_customer_enum')).toBe('test');
		expect(mockAsyncStorageRows['persist:root']).toBe('{"a":1}');
		expect(mockAsyncStorageRows['auth_data']).toBe('{"token":"xyz"}');
		expect(mockAsyncStorageRows['selected_customer_enum']).toBe('test');
	});

	it('retries on the next boot if the previous boot never verified successfully, self-healing a bad run', async () => {
		// mockSqliteRows has stale/wrong data and, crucially, no "verified" sentinel - as if a
		// previous boot copied it wrong and (correctly, per the fix below) never marked
		// itself done. A fresh boot must retry and overwrite it with the real value.
		mockSqliteRows['persist:root'] = '{"a":"poisoned-by-a-previous-buggy-boot"}';
		mockAsyncStorageRows['persist:root'] = '{"a":"real"}';

		const { sqliteKeyValueStorage } = require('./sqliteStorage');
		expect(await sqliteKeyValueStorage.getItem('persist:root')).toBe('{"a":"real"}');
	});

	it('does not mark the migration verified if a write silently fails, and retries next boot', async () => {
		// Regression coverage for the bug INSERT OR IGNORE caused: a copy that doesn't
		// actually land must not be trusted just because nothing threw.
		mockAsyncStorageRows['flaky_key'] = '"value"';
		mockFailNextWriteForKey = 'flaky_key';

		const { sqliteKeyValueStorage: firstBoot } = require('./sqliteStorage');
		expect(await firstBoot.getItem('flaky_key')).toBeNull(); // the simulated failed write

		jest.resetModules();
		const { sqliteKeyValueStorage: secondBoot } = require('./sqliteStorage');
		expect(await secondBoot.getItem('flaky_key')).toBe('"value"'); // retried, and this time nothing failed
	});

	it('does NOT overwrite a newer sqlite write with AsyncStorage once the migration is verified', async () => {
		// Regression test for a real incident: without a "verified, stop repeating" gate,
		// the copy re-ran unconditionally on every boot. Since AsyncStorage is kept around
		// as a frozen snapshot (never updated again after migration), that meant every
		// restart silently reverted any value the app had since written via setItem() back
		// to whatever AsyncStorage happened to have at the very first migration - the app
		// could never actually "live" in sqlite afterwards.
		mockAsyncStorageRows['foo'] = '"old-value-from-async-storage"';

		const { sqliteKeyValueStorage: firstBoot } = require('./sqliteStorage');
		expect(await firstBoot.getItem('foo')).toBe('"old-value-from-async-storage"'); // migrated + verified this boot

		await firstBoot.setItem('foo', '"new-value-written-after-migration"');

		jest.resetModules();
		const { sqliteKeyValueStorage: secondBoot } = require('./sqliteStorage');
		expect(await secondBoot.getItem('foo')).toBe('"new-value-written-after-migration"');
	});

	it('setItem/removeItem/multiRemove/clear operate directly on sqlite', async () => {
		const { sqliteKeyValueStorage } = require('./sqliteStorage');

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
		mockAsyncStorageRows['persist:root'] = '{"a":1}';
		const { sqliteStorage } = require('./sqliteStorage');
		expect(await sqliteStorage.getItem('persist:root')).toBe('{"a":1}');
	});

	it('migrateAsyncStorageToSqlite() (the debug "Daten migrieren" button) can be re-run manually any time', async () => {
		const { sqliteKeyValueStorage, migrateAsyncStorageToSqlite } = require('./sqliteStorage');
		await sqliteKeyValueStorage.getItem('anything'); // forces the db (and the boot-time migration) open

		// Something left a key in AsyncStorage after boot already ran the automatic copy
		// (e.g. a setting changed while offline via code that still writes AsyncStorage).
		mockAsyncStorageRows['leftover_key'] = '"still here"';

		const result = await migrateAsyncStorageToSqlite();
		expect(result.migratedKeys).toContain('leftover_key');
		expect(await sqliteKeyValueStorage.getItem('leftover_key')).toBe('"still here"');

		// AsyncStorage is kept as a safety net for now - re-running again should still
		// report the same key, not an empty list.
		const secondResult = await migrateAsyncStorageToSqlite();
		expect(secondResult.migratedKeys).toContain('leftover_key');
	});
});

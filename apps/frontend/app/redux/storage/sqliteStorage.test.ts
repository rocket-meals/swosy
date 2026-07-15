import AsyncStorage from '@react-native-async-storage/async-storage';

const sqliteRows: Record<string, string> = {};

jest.mock('expo-sqlite', () => ({
	openDatabaseAsync: jest.fn(async () => ({
		execAsync: jest.fn(async () => {}),
		runAsync: jest.fn(async (sql: string, key: string, value?: string) => {
			if (sql.startsWith('INSERT')) {
				sqliteRows[key] = value as string;
			} else if (sql.startsWith('DELETE')) {
				delete sqliteRows[key];
			}
		}),
		getFirstAsync: jest.fn(async (sql: string, key: string) => (key in sqliteRows ? { value: sqliteRows[key] } : null)),
	})),
}));

import { sqliteStorage } from './sqliteStorage';

describe('sqliteStorage', () => {
	beforeEach(async () => {
		await AsyncStorage.clear();
		Object.keys(sqliteRows).forEach((key) => delete sqliteRows[key]);
	});

	it('returns null for a key that exists nowhere', async () => {
		expect(await sqliteStorage.getItem('missing')).toBeNull();
	});

	it('migrates a legacy AsyncStorage value into sqlite and removes it from AsyncStorage', async () => {
		await AsyncStorage.setItem('persist:root', '{"a":1}');

		const value = await sqliteStorage.getItem('persist:root');

		expect(value).toBe('{"a":1}');
		expect(sqliteRows['persist:root']).toBe('{"a":1}');
		expect(await AsyncStorage.getItem('persist:root')).toBeNull();
	});

	it('reads from sqlite once migrated, ignoring anything later written back to AsyncStorage', async () => {
		await AsyncStorage.setItem('persist:root', '{"a":1}');
		await sqliteStorage.getItem('persist:root'); // triggers migration

		await AsyncStorage.setItem('persist:root', '{"a":"stale-should-be-ignored"}');

		const value = await sqliteStorage.getItem('persist:root');
		expect(value).toBe('{"a":1}');
	});

	it('setItem/removeItem operate directly on sqlite', async () => {
		await sqliteStorage.setItem('foo', 'bar');
		expect(await sqliteStorage.getItem('foo')).toBe('bar');

		await sqliteStorage.removeItem('foo');
		expect(await sqliteStorage.getItem('foo')).toBeNull();
	});
});

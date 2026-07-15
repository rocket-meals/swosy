import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUtf8ByteLength, formatBytes } from 'repo-depkit-common-ui';

export type AsyncStorageKeyUsage = {
	key: string;
	bytes: number;
};

// Re-exported for existing callers (this module used to define these itself) - the
// implementation now lives in repo-depkit-common-ui so the sqlite debug storage list
// (SettingsListSqliteStorage) can share the same byte-formatting as this AsyncStorage one.
export { getUtf8ByteLength, formatBytes };

// What's left in AsyncStorage right now - meant to be near-empty on native once the
// migration in redux/storage/sqliteStorage.ts has run. Shown in the debug settings screen
// next to "SQLite gesamt" so a stuck migration is visible instead of silent.
export const getAsyncStorageUsage = async (): Promise<{ items: AsyncStorageKeyUsage[]; totalBytes: number }> => {
	const keys = await AsyncStorage.getAllKeys();
	const entries = await AsyncStorage.multiGet(keys);
	const items = entries
		.map(([key, value]) => ({ key, bytes: value ? getUtf8ByteLength(value) : 0 }))
		.sort((a, b) => b.bytes - a.bytes);
	const totalBytes = items.reduce((sum, item) => sum + item.bytes, 0);
	return { items, totalBytes };
};

// Debug-only escape hatch for the settings screen's "AsyncStorage löschen" button - lets a
// tester wipe AsyncStorage on demand (e.g. to set up a clean state for re-testing the
// sqlite migration in redux/storage/sqliteStorage.ts). Not used by any non-debug code path.
export const clearAsyncStorage = async (): Promise<void> => {
	await AsyncStorage.clear();
};

import AsyncStorage from '@react-native-async-storage/async-storage';

export type AsyncStorageKeyUsage = {
	key: string;
	bytes: number;
};

// Approximates the UTF-8 byte size a stored value takes up, without relying on
// TextEncoder (not guaranteed to exist on every RN/Hermes runtime this app targets).
// Also used by SqliteStorageUsageHelper.ts for the debug storage-usage screen.
export const getUtf8ByteLength = (value: string): number => {
	let bytes = 0;
	for (let i = 0; i < value.length; i++) {
		const codePoint = value.codePointAt(i) as number;
		if (codePoint > 0xffff) i++; // surrogate pair - consumes two UTF-16 code units
		if (codePoint <= 0x7f) bytes += 1;
		else if (codePoint <= 0x7ff) bytes += 2;
		else if (codePoint <= 0xffff) bytes += 3;
		else bytes += 4;
	}
	return bytes;
};

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

export const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

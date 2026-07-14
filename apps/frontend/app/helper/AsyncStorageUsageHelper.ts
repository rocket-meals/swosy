import AsyncStorage from '@react-native-async-storage/async-storage';

export type AsyncStorageKeyUsage = {
	key: string;
	bytes: number;
};

// Approximates the UTF-8 byte size AsyncStorage actually persists per key, without relying
// on TextEncoder (not guaranteed to exist on every RN/Hermes runtime this app targets).
// Exported for reuse by SqliteStorageUsageHelper.ts, which needs the same approximation
// for values read out of the sqlite kv table.
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

export const getAsyncStorageUsage = async (): Promise<{ items: AsyncStorageKeyUsage[]; totalBytes: number }> => {
	const keys = await AsyncStorage.getAllKeys();
	const entries = await AsyncStorage.multiGet(keys);
	const items = entries
		.map(([key, value]) => ({ key, bytes: value ? getUtf8ByteLength(value) : 0 }))
		.sort((a, b) => b.bytes - a.bytes);
	const totalBytes = items.reduce((sum, item) => sum + item.bytes, 0);
	return { items, totalBytes };
};

export const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

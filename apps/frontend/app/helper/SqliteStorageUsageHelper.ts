import { getSqliteDb } from '@/redux/storage/sqliteStorage';
import { getUtf8ByteLength } from './AsyncStorageUsageHelper';

export type SqliteStorageKeyUsage = {
	key: string;
	bytes: number;
};

// Mirrors getAsyncStorageUsage() in AsyncStorageUsageHelper.ts, but reads the sqlite kv
// table that redux/storage/sqliteStorage.ts persists redux-persist's state into on native.
export const getSqliteStorageUsage = async (): Promise<{ items: SqliteStorageKeyUsage[]; totalBytes: number }> => {
	const db = await getSqliteDb();
	const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM kv');
	const items = rows
		.filter((row) => !row.key.startsWith('__') || !row.key.endsWith('__'))
		.map((row) => ({ key: row.key, bytes: getUtf8ByteLength(row.value) }))
		.sort((a, b) => b.bytes - a.bytes);
	const totalBytes = items.reduce((sum, item) => sum + item.bytes, 0);
	return { items, totalBytes };
};

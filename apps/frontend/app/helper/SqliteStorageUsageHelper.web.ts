export type SqliteStorageKeyUsage = {
	key: string;
	bytes: number;
};

// Web keeps using AsyncStorage (see redux/storage/sqliteStorage.web.ts) - there's no
// separate sqlite-backed store to report on this platform.
export const getSqliteStorageUsage = async (): Promise<{ items: SqliteStorageKeyUsage[]; totalBytes: number }> => {
	return { items: [], totalBytes: 0 };
};

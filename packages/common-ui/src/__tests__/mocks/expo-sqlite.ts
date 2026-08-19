/**
 * Minimal `expo-sqlite` stand-in for the node test environment.
 *
 * The helpers under test (`parseKvBackupJson`, `createKvBackupJson`, ...) only need the
 * module to be importable – they never touch a real database in these tests. Anything that
 * does hit SQLite belongs in an app-level test with the real native module.
 */

export interface MockSQLiteDatabase {
	execAsync: (sql: string) => Promise<void>;
	getAllAsync: <T>(sql: string) => Promise<T[]>;
	runAsync: (sql: string, ...params: unknown[]) => Promise<{ changes: number }>;
	withTransactionAsync: (callback: () => Promise<void>) => Promise<void>;
}

export const openDatabaseAsync = async (): Promise<MockSQLiteDatabase> => ({
	execAsync: async () => undefined,
	getAllAsync: async <T>(): Promise<T[]> => [],
	runAsync: async () => ({ changes: 0 }),
	withTransactionAsync: async (callback: () => Promise<void>) => {
		await callback();
	},
});

export const deleteDatabaseAsync = async (): Promise<void> => undefined;

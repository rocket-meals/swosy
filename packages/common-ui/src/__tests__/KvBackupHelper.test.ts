import {
	KV_BACKUP_FILE_TYPE,
	KV_BACKUP_FILE_VERSION,
	parseKvBackupJson,
	type KvBackupFile,
} from '../helpers/KvBackupHelper';

const validBackup = (overrides: Partial<KvBackupFile> = {}): Record<string, unknown> => ({
	type: KV_BACKUP_FILE_TYPE,
	version: KV_BACKUP_FILE_VERSION,
	app: 'score-tracker',
	dbName: 'my-db',
	exportedAt: '2026-01-01T00:00:00.000Z',
	entries: { a: '1', b: '2' },
	...overrides,
});

describe('parseKvBackupJson', () => {
	it('parses a well-formed backup', () => {
		expect(parseKvBackupJson(JSON.stringify(validBackup()))).toEqual({
			type: KV_BACKUP_FILE_TYPE,
			version: KV_BACKUP_FILE_VERSION,
			app: 'score-tracker',
			dbName: 'my-db',
			exportedAt: '2026-01-01T00:00:00.000Z',
			entries: { a: '1', b: '2' },
		});
	});

	it('accepts an empty entries object', () => {
		expect(parseKvBackupJson(JSON.stringify(validBackup({ entries: {} }))).entries).toEqual({});
	});

	it('accepts an older backup version', () => {
		expect(parseKvBackupJson(JSON.stringify(validBackup({ version: 0 }))).version).toBe(0);
	});

	it('rejects malformed JSON', () => {
		expect(() => parseKvBackupJson('{not json')).toThrow('Backup file is not valid JSON');
	});

	it('rejects a JSON value that is not an object', () => {
		expect(() => parseKvBackupJson('42')).toThrow('Backup file has an unexpected structure');
		expect(() => parseKvBackupJson('null')).toThrow('Backup file has an unexpected structure');
	});

	it('rejects a file without the backup type marker', () => {
		expect(() => parseKvBackupJson(JSON.stringify(validBackup({ type: 'something-else' as never })))).toThrow(
			'File is not a kv storage backup',
		);
	});

	it('rejects a version newer than this build understands', () => {
		expect(() => parseKvBackupJson(JSON.stringify(validBackup({ version: KV_BACKUP_FILE_VERSION + 1 })))).toThrow(
			/Unsupported backup version/,
		);
	});

	it('rejects a non-numeric version', () => {
		expect(() => parseKvBackupJson(JSON.stringify(validBackup({ version: 'one' as never })))).toThrow(
			/Unsupported backup version/,
		);
	});

	it('rejects entries that are not an object', () => {
		for (const entries of [null, [], 'nope'] as never[]) {
			expect(() => parseKvBackupJson(JSON.stringify(validBackup({ entries })))).toThrow(
				'Backup file contains no entries object',
			);
		}
	});

	it('rejects a non-string entry value and names the offending key', () => {
		expect(() => parseKvBackupJson(JSON.stringify(validBackup({ entries: { a: 1 } as never })))).toThrow(
			'Backup entry "a" is not a string value',
		);
	});

	it('falls back to defaults for a missing app, dbName and exportedAt', () => {
		const parsed = parseKvBackupJson(
			JSON.stringify({ type: KV_BACKUP_FILE_TYPE, version: KV_BACKUP_FILE_VERSION, entries: {} }),
		);
		expect(parsed.app).toBeUndefined();
		expect(parsed.dbName.length).toBeGreaterThan(0);
		expect(parsed.exportedAt).toBe('');
	});
});

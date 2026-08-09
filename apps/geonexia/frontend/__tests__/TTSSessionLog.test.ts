/**
 * Tests for the TTS session log: collection lifecycle (start/finish), the
 * inactive no-op behaviour, and the entry cap.
 */

// Re-required from a fresh module registry per test — the log keeps
// module-level state.
let SessionLog: typeof import('../helpers/TTSSessionLog');

beforeEach(() => {
	jest.resetModules();
	jest.useFakeTimers();
	jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));
	jest.spyOn(console, 'log').mockImplementation(() => {});
	/* eslint-disable-next-line @typescript-eslint/no-require-imports */
	SessionLog = require('../helpers/TTSSessionLog');
});

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('TTSSessionLog', () => {
	test('collects events between start and finish, framed by session markers', () => {
		SessionLog.startTTSSessionLog();
		SessionLog.recordTTSSessionEvent('enqueued', { source: 'periodic', text: 'hallo', detail: 'queueLength=1' });
		SessionLog.recordTTSSessionEvent('speak_start', { source: 'periodic', detail: 'waitedMs=5' });
		SessionLog.recordTTSSessionEvent('speak_done', { source: 'periodic', detail: 'speakingMs=1200' });
		const entries = SessionLog.finishTTSSessionLog();

		expect(entries.map((e) => e.event)).toEqual([
			'session_started',
			'enqueued',
			'speak_start',
			'speak_done',
			'session_finished',
		]);
		expect(entries[1]).toMatchObject({
			timestamp: new Date('2026-01-01T10:00:00Z').getTime(),
			source: 'periodic',
			text: 'hallo',
			detail: 'queueLength=1',
		});
	});

	test('ignores events while no collection is active', () => {
		SessionLog.recordTTSSessionEvent('enqueued', { source: 'sample' });
		expect(SessionLog.finishTTSSessionLog()).toEqual([]);

		SessionLog.startTTSSessionLog();
		const entries = SessionLog.finishTTSSessionLog();
		expect(entries.map((e) => e.event)).toEqual(['session_started', 'session_finished']);

		// After finishing, further events are ignored again.
		SessionLog.recordTTSSessionEvent('queue_cleared');
		expect(SessionLog.finishTTSSessionLog()).toEqual([]);
	});

	test('a new start discards the previous collection', () => {
		SessionLog.startTTSSessionLog();
		SessionLog.recordTTSSessionEvent('enqueued', { source: 'old' });
		SessionLog.startTTSSessionLog();
		const entries = SessionLog.finishTTSSessionLog();

		expect(entries.some((e) => e.source === 'old')).toBe(false);
	});

	test('caps the log by discarding the oldest entries', () => {
		SessionLog.startTTSSessionLog();
		for (let i = 0; i < 2100; i++) {
			SessionLog.recordTTSSessionEvent('enqueued', { detail: `i=${i}` });
		}
		const entries = SessionLog.finishTTSSessionLog();

		expect(entries.length).toBeLessThanOrEqual(2000);
		// The newest entries survive; the oldest (including the start marker) are dropped.
		expect(entries[entries.length - 1].event).toBe('session_finished');
		expect(entries[entries.length - 2].detail).toBe('i=2099');
	});
});

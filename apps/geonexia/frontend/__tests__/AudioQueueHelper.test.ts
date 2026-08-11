/**
 * Tests for the TTS announcement queue: staleness (max-age) dropping,
 * same-source coalescing, the queue cap, and speech-only music ducking.
 */

jest.mock('expo-speech', () => ({
	speak: jest.fn(),
	stop: jest.fn(),
}));

jest.mock('expo-audio', () => ({
	setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
	setIsAudioActiveAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../helpers/TTSLogStorage', () => ({
	appendTTSLogEntry: jest.fn().mockResolvedValue(undefined),
}));

type SpeakOptions = {
	onDone?: () => void;
	onError?: (err: unknown) => void;
	onStopped?: () => void;
	language?: string;
};

// Re-required from the fresh module registry in beforeEach — the queue keeps
// module-level state, so every test needs its own module instance and the
// mock instances that belong to the same registry.
let AudioQueue: typeof import('../helpers/AudioQueueHelper');
let speakMock: jest.Mock;
let stopMock: jest.Mock;
let setAudioModeMock: jest.Mock;
let setIsAudioActiveMock: jest.Mock;

/** Options of the most recent Speech.speak call. */
function lastSpeakOptions(): SpeakOptions {
	const call = speakMock.mock.calls[speakMock.mock.calls.length - 1];
	return call[1] as SpeakOptions;
}

/** Flush pending microtasks (the ducking activation is async). */
async function flushMicrotasks(): Promise<void> {
	for (let i = 0; i < 5; i++) {
		await Promise.resolve();
	}
}

beforeEach(() => {
	jest.resetModules();
	jest.useFakeTimers();
	jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));
	/* eslint-disable @typescript-eslint/no-require-imports */
	AudioQueue = require('../helpers/AudioQueueHelper');
	const speech = require('expo-speech');
	speakMock = speech.speak as jest.Mock;
	stopMock = speech.stop as jest.Mock;
	const audio = require('expo-audio');
	setAudioModeMock = audio.setAudioModeAsync as jest.Mock;
	setIsAudioActiveMock = audio.setIsAudioActiveAsync as jest.Mock;
	/* eslint-enable @typescript-eslint/no-require-imports */
});

afterEach(() => {
	jest.useRealTimers();
});

describe('AudioQueueHelper', () => {
	test('speaks the first item immediately and the second after the first finishes', async () => {
		AudioQueue.enqueueAnnouncement('one', 'de', undefined, 'periodic');
		AudioQueue.enqueueAnnouncement('two', 'de', undefined, 'km_milestone');
		await flushMicrotasks();

		expect(speakMock).toHaveBeenCalledTimes(1);
		expect(speakMock.mock.calls[0][0]).toBe('one');

		lastSpeakOptions().onDone?.();
		await flushMicrotasks();

		expect(speakMock).toHaveBeenCalledTimes(2);
		expect(speakMock.mock.calls[1][0]).toBe('two');
	});

	test('replaceSameSource keeps only the newest pending announcement of a source', async () => {
		AudioQueue.enqueueAnnouncement('playing', 'de', undefined, 'periodic');
		await flushMicrotasks();
		// These two wait in the queue; the second supersedes the first.
		AudioQueue.enqueueAnnouncement('stale periodic', 'de', undefined, 'periodic', { replaceSameSource: true });
		AudioQueue.enqueueAnnouncement('fresh periodic', 'de', undefined, 'periodic', { replaceSameSource: true });

		lastSpeakOptions().onDone?.();
		await flushMicrotasks();

		expect(speakMock).toHaveBeenCalledTimes(2);
		expect(speakMock.mock.calls[1][0]).toBe('fresh periodic');

		lastSpeakOptions().onDone?.();
		await flushMicrotasks();
		// Nothing else queued.
		expect(speakMock).toHaveBeenCalledTimes(2);
	});

	test('drops items that exceeded their maxAgeMs instead of speaking them', async () => {
		AudioQueue.enqueueAnnouncement('playing', 'de', undefined, 'periodic');
		await flushMicrotasks();
		AudioQueue.enqueueAnnouncement('stale stats', 'de', undefined, 'km_milestone', { maxAgeMs: 30_000 });
		AudioQueue.enqueueAnnouncement('still fresh', 'de', undefined, 'pace_hint', { maxAgeMs: 10 * 60_000 });

		// Simulate the app being suspended for 5 minutes while the first item
		// "plays" (iOS froze the JS timers; announcements piled up).
		jest.setSystemTime(new Date('2026-01-01T10:05:00Z'));
		lastSpeakOptions().onDone?.();
		await flushMicrotasks();

		expect(speakMock).toHaveBeenCalledTimes(2);
		expect(speakMock.mock.calls[1][0]).toBe('still fresh');
	});

	test('caps the queue and drops the oldest pending item', async () => {
		AudioQueue.enqueueAnnouncement('playing', 'de', undefined, 'a');
		await flushMicrotasks();
		AudioQueue.enqueueAnnouncement('q1', 'de', undefined, 'b');
		AudioQueue.enqueueAnnouncement('q2', 'de', undefined, 'c');
		AudioQueue.enqueueAnnouncement('q3', 'de', undefined, 'd');
		AudioQueue.enqueueAnnouncement('q4', 'de', undefined, 'e'); // pushes q1 out

		const spoken: string[] = [];
		for (let i = 0; i < 4; i++) {
			lastSpeakOptions().onDone?.();
			await flushMicrotasks();
			const call = speakMock.mock.calls[speakMock.mock.calls.length - 1];
			spoken.push(call[0] as string);
		}
		expect(spoken).toEqual(['q2', 'q3', 'q4', 'q4']);
		expect(speakMock).toHaveBeenCalledTimes(4);
	});

	test('ducks music only while speaking and releases the session after the queue drains', async () => {
		AudioQueue.enqueueAnnouncement('hello', 'de', undefined, 'periodic');
		await flushMicrotasks();

		// Ducking session activated before speaking.
		expect(setAudioModeMock).toHaveBeenCalledWith(expect.objectContaining({ interruptionMode: 'duckOthers' }));
		expect(setIsAudioActiveMock).toHaveBeenCalledWith(true);
		expect(speakMock).toHaveBeenCalledTimes(1);

		setAudioModeMock.mockClear();
		setIsAudioActiveMock.mockClear();

		lastSpeakOptions().onDone?.();
		await flushMicrotasks();
		// Release is debounced — not yet released right after finishing.
		expect(setIsAudioActiveMock).not.toHaveBeenCalledWith(false);

		jest.runOnlyPendingTimers();
		await flushMicrotasks();
		// Session deactivated (music back to full volume) and idle mode restored.
		expect(setIsAudioActiveMock).toHaveBeenCalledWith(false);
		expect(setAudioModeMock).toHaveBeenCalledWith(expect.objectContaining({ interruptionMode: 'mixWithOthers' }));
	});

	test('duckOthers: false mixes with music instead of ducking it', async () => {
		AudioQueue.enqueueAnnouncement('hello', 'de', undefined, 'sample', { duckOthers: false });
		await flushMicrotasks();

		expect(setAudioModeMock).toHaveBeenCalledWith(expect.objectContaining({ interruptionMode: 'mixWithOthers' }));
		expect(setAudioModeMock).not.toHaveBeenCalledWith(expect.objectContaining({ interruptionMode: 'duckOthers' }));
		expect(setIsAudioActiveMock).toHaveBeenCalledWith(true);
		expect(speakMock).toHaveBeenCalledTimes(1);
	});

	test('never lets the synthesizer use its private audio session', async () => {
		// A caller passing useApplicationAudioSession: false must be overridden —
		// the private session hard-stops other apps' music and stays active,
		// stopping the music again on every app foreground.
		AudioQueue.enqueueAnnouncement('hello', 'de', { useApplicationAudioSession: false }, 'sample');
		await flushMicrotasks();

		expect(speakMock).toHaveBeenCalledTimes(1);
		const options = lastSpeakOptions() as SpeakOptions & { useApplicationAudioSession?: boolean };
		expect(options.useApplicationAudioSession).toBe(true);
	});

	test('clearAudioQueue stops speech and prevents a pending item from starting', async () => {
		AudioQueue.enqueueAnnouncement('hello', 'de', undefined, 'periodic');
		// Clear before the async ducking activation resolves.
		AudioQueue.clearAudioQueue();
		await flushMicrotasks();

		expect(stopMock).toHaveBeenCalled();
		expect(speakMock).not.toHaveBeenCalled();
	});
});

import * as Speech from 'expo-speech';
import { appendTTSLogEntry, SpokenTextFields } from './TTSLogStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueItem extends SpokenTextFields {
	options?: Omit<Speech.SpeechOptions, 'language' | 'onDone' | 'onError' | 'onStopped'>;
}

// ─── Module-level queue state ─────────────────────────────────────────────────

/**
 * Hard cap on the number of pending announcements. Without this, a
 * misconfigured periodic interval (or a run of km-milestone/pace-hint
 * announcements arriving faster than they can be spoken) makes the queue
 * grow without bound for the entire duration of a run — the app ends up
 * talking non-stop with increasingly stale information and can eventually
 * crash from the unbounded memory growth. When the cap is hit, the oldest
 * pending (not-yet-spoken) item is dropped in favour of the newest one, so
 * the runner always hears the most current stats.
 */
const MAX_QUEUE_LENGTH = 3;

const _queue: QueueItem[] = [];
let _isPlaying = false;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function processNext(): void {
	if (_isPlaying || _queue.length === 0) return;
	const item = _queue.shift();
	if (item == null) return;
	_isPlaying = true;

	try {
		Speech.speak(item.text, {
			useApplicationAudioSession: true,
			...item.options,
			language: item.languageCode,
			onDone: () => {
				void appendTTSLogEntry({
					timestamp: Date.now(),
					text: item.text,
					languageCode: item.languageCode,
					success: true,
					source: item.source,
				});
				_isPlaying = false;
				processNext();
			},
			onError: (err) => {
				const message = err instanceof Error ? err.message : String(err);
				console.warn('[AudioQueueHelper] Speech error:', message);
				void appendTTSLogEntry({
					timestamp: Date.now(),
					text: item.text,
					languageCode: item.languageCode,
					success: false,
					error: message,
					source: item.source,
				});
				_isPlaying = false;
				processNext();
			},
			onStopped: () => {
				// Manual stop via clearAudioQueue – do not advance to next item.
				_isPlaying = false;
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn('[AudioQueueHelper] Speech.speak threw:', message);
		void appendTTSLogEntry({
			timestamp: Date.now(),
			text: item.text,
			languageCode: item.languageCode,
			success: false,
			error: message,
			source: item.source,
		});
		_isPlaying = false;
		processNext();
	}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a TTS announcement to the queue.
 * If nothing is currently playing the item is spoken immediately; otherwise it
 * waits until all preceding items have finished.
 *
 * @param text          Text to speak.
 * @param languageCode  BCP-47 language code (e.g. "de", "en").
 * @param options       Additional expo-speech options (excluding `language`,
 *                      `onDone`, `onError`, `onStopped`).
 * @param source        Label for logging (e.g. `"km_milestone"`, `"pace_hint"`).
 */
export function enqueueAnnouncement(
	text: string,
	languageCode: string,
	options?: Omit<Speech.SpeechOptions, 'language' | 'onDone' | 'onError' | 'onStopped'>,
	source: string = 'unknown',
): void {
	// Drop the oldest queued (not yet playing) item once the cap is reached so
	// the queue can never grow without bound — see MAX_QUEUE_LENGTH above.
	if (_queue.length >= MAX_QUEUE_LENGTH) {
		const dropped = _queue.shift();
		if (dropped) {
			console.warn('[AudioQueueHelper] Queue full, dropping stale announcement:', dropped.source);
		}
	}
	_queue.push({ text, languageCode, options, source });
	processNext();
}

/**
 * Clear all pending queue items and stop any currently playing speech.
 * Call this when recording stops or when the user cancels announcements.
 */
export function clearAudioQueue(): void {
	_queue.length = 0;
	try {
		Speech.stop();
	} catch (err) {
		console.warn('[AudioQueueHelper] Speech.stop threw:', err);
	}
	// _isPlaying is reset by the onStopped callback of Speech.speak.
}

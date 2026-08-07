import * as Speech from 'expo-speech';
import { appendTTSLogEntry, SpokenTextFields } from './TTSLogStorage';
import { activateSpeechDucking, scheduleSpeechDuckingRelease } from './SpeechAudioSession';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueItem extends SpokenTextFields {
	options?: Omit<Speech.SpeechOptions, 'language' | 'onDone' | 'onError' | 'onStopped'>;
	/** Timestamp (ms) when the item was enqueued; used for the max-age check. */
	enqueuedAt: number;
	/** Maximum age (ms) an item may reach before playback; older items are dropped. */
	maxAgeMs?: number;
}

/**
 * Per-announcement queue behaviour.
 */
export interface EnqueueAnnouncementOptions {
	/**
	 * Drop the item instead of speaking it when it waited longer than this
	 * many milliseconds in the queue. Stats announcements (distance, pace, …)
	 * are worthless once stale — after the app was suspended in the background
	 * they used to pile up and then play "all at once" with outdated values.
	 */
	maxAgeMs?: number;
	/**
	 * Replace any pending (not yet playing) items with the same `source`
	 * instead of queueing another one. Ensures at most one announcement per
	 * kind waits in the queue — after a background wake-up only the newest
	 * periodic/km/pace announcement is spoken instead of the whole backlog.
	 */
	replaceSameSource?: boolean;
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
/** Incremented by clearAudioQueue so an in-flight (awaiting audio session)
 * item does not start speaking after the user stopped announcements. */
let _stopGeneration = 0;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function logDroppedItem(item: QueueItem, reason: string): void {
	console.warn(`[AudioQueueHelper] Dropping announcement (${reason}):`, item.source);
	void appendTTSLogEntry({
		timestamp: Date.now(),
		text: item.text,
		languageCode: item.languageCode,
		success: false,
		error: `dropped: ${reason}`,
		source: item.source,
	});
}

/** Remove expired items from the front of the queue so stale announcements
 * (e.g. queued while the app was suspended) are never spoken. */
function dropExpiredItems(): void {
	const now = Date.now();
	while (_queue.length > 0) {
		const head = _queue[0];
		if (head.maxAgeMs != null && now - head.enqueuedAt > head.maxAgeMs) {
			_queue.shift();
			logDroppedItem(head, 'stale');
		} else {
			break;
		}
	}
}

function finishItem(): void {
	_isPlaying = false;
	if (_queue.length === 0) {
		// Queue drained – give the music its volume back (debounced).
		scheduleSpeechDuckingRelease();
	} else {
		processNext();
	}
}

function speakItem(item: QueueItem): void {
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
				finishItem();
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
				finishItem();
			},
			onStopped: () => {
				// Manual stop via clearAudioQueue – do not advance to next item.
				_isPlaying = false;
				scheduleSpeechDuckingRelease();
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
		finishItem();
	}
}

function processNext(): void {
	if (_isPlaying) return;
	dropExpiredItems();
	if (_queue.length === 0) {
		scheduleSpeechDuckingRelease();
		return;
	}
	const item = _queue.shift();
	if (item == null) return;
	_isPlaying = true;

	// Duck other apps' music only for the duration of the announcement (plus a
	// short debounce), not for the whole recording. Items that explicitly opt
	// out of the application audio session skip the ducking activation.
	const wantsDucking = item.options?.useApplicationAudioSession !== false;
	if (wantsDucking) {
		const generation = _stopGeneration;
		void activateSpeechDucking()
			.catch(() => { /* logged inside activateSpeechDucking */ })
			.then(() => {
				if (generation !== _stopGeneration) {
					// clearAudioQueue was called while the audio session was being
					// activated – do not start speaking a cancelled announcement.
					_isPlaying = false;
					scheduleSpeechDuckingRelease();
					return;
				}
				speakItem(item);
			});
	} else {
		speakItem(item);
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
 * @param queueOptions  Queue behaviour: staleness limit and same-source
 *                      coalescing (see {@link EnqueueAnnouncementOptions}).
 */
export function enqueueAnnouncement(
	text: string,
	languageCode: string,
	options?: Omit<Speech.SpeechOptions, 'language' | 'onDone' | 'onError' | 'onStopped'>,
	source: string = 'unknown',
	queueOptions?: EnqueueAnnouncementOptions,
): void {
	// Coalesce: a newer announcement of the same kind supersedes pending ones
	// (e.g. only the most recent periodic stats update is worth hearing).
	if (queueOptions?.replaceSameSource) {
		for (let i = _queue.length - 1; i >= 0; i--) {
			if (_queue[i].source === source) {
				const [replaced] = _queue.splice(i, 1);
				if (replaced != null) {
					logDroppedItem(replaced, 'superseded');
				}
			}
		}
	}
	// Drop the oldest queued (not yet playing) item once the cap is reached so
	// the queue can never grow without bound — see MAX_QUEUE_LENGTH above.
	if (_queue.length >= MAX_QUEUE_LENGTH) {
		const dropped = _queue.shift();
		if (dropped) {
			logDroppedItem(dropped, 'queue full');
		}
	}
	_queue.push({
		text,
		languageCode,
		options,
		source,
		enqueuedAt: Date.now(),
		maxAgeMs: queueOptions?.maxAgeMs,
	});
	processNext();
}

/**
 * Clear all pending queue items and stop any currently playing speech.
 * Call this when recording stops or when the user cancels announcements.
 */
export function clearAudioQueue(): void {
	_queue.length = 0;
	_stopGeneration++;
	try {
		Speech.stop();
	} catch (err) {
		console.warn('[AudioQueueHelper] Speech.stop threw:', err);
	}
	// _isPlaying is reset by the onStopped callback of Speech.speak.
	scheduleSpeechDuckingRelease();
}

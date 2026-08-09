// ─── TTS session log ──────────────────────────────────────────────────────────
//
// In-memory event log of everything the TTS announcement pipeline does during
// an activity recording: enqueueing, queue drops (stale / superseded / queue
// full), audio-session activation, speech start/end/errors and queue clears.
// The record screen starts collection when a recording starts and attaches the
// collected entries to the saved activity (`SavedActivity.ttsLog`) so late or
// missing announcements can be debugged from the exported activity data.
//
// Every event is additionally written to the console so live debugging sees
// the same stream.

export type TTSSessionLogEvent =
	| 'session_started'
	| 'enqueued'
	| 'superseded'
	| 'dropped_stale'
	| 'dropped_queue_full'
	| 'audio_session_activating'
	| 'cancelled_before_speak'
	| 'speak_start'
	| 'speak_done'
	| 'speak_error'
	| 'speak_stopped'
	| 'queue_cleared'
	| 'session_finished';

export type TTSSessionLogEntry = {
	/** Unix timestamp (ms) when the event occurred. */
	timestamp: number;
	event: TTSSessionLogEvent;
	/** Announcement source label (e.g. "periodic", "km_milestone", "auto_pause"). */
	source?: string;
	/** The announcement text, where applicable. */
	text?: string;
	/** Free-form context, e.g. "queueLength=2" or "waitedMs=1234". */
	detail?: string;
};

/**
 * Hard cap on collected entries per recording so a very long activity cannot
 * grow the log (and the saved activity JSON) without bound. When the cap is
 * reached the oldest entries are discarded — the newest events are the ones
 * needed to debug what just went wrong.
 */
const MAX_SESSION_LOG_ENTRIES = 2000;

let _active = false;
let _entries: TTSSessionLogEntry[] = [];

/** Start collecting TTS events for a new recording, discarding any prior log. */
export function startTTSSessionLog(): void {
	_entries = [];
	_active = true;
	recordTTSSessionEvent('session_started');
}

/**
 * Stop collecting and return the collected entries (oldest first).
 * Returns an empty array when no collection was active.
 */
export function finishTTSSessionLog(): TTSSessionLogEntry[] {
	if (!_active) return [];
	recordTTSSessionEvent('session_finished');
	_active = false;
	const entries = _entries;
	_entries = [];
	return entries;
}

/**
 * Record a single TTS pipeline event. Always logged to the console; stored in
 * the session log only while a collection is active (i.e. during a recording).
 */
export function recordTTSSessionEvent(
	event: TTSSessionLogEvent,
	fields?: { source?: string; text?: string; detail?: string },
): void {
	const parts = [
		fields?.source != null ? `source=${fields.source}` : null,
		fields?.detail ?? null,
		fields?.text != null ? `"${fields.text}"` : null,
	].filter(Boolean);
	console.log(`[TTSSessionLog] ${event}${parts.length > 0 ? ` (${parts.join(', ')})` : ''}`);
	if (!_active) return;
	if (_entries.length >= MAX_SESSION_LOG_ENTRIES) {
		_entries.shift();
	}
	_entries.push({ timestamp: Date.now(), event, ...fields });
}

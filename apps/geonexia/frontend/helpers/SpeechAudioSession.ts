import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

// ─── Speech audio session management ─────────────────────────────────────────
//
// Music from other apps must only be affected WHILE an announcement is
// actually being spoken. The session is kept in a non-mixing base mode and is
// only activated (with either `duckOthers` or `mixWithOthers`) around actual
// speech playback, then deactivated again — deactivation notifies other apps
// so their music returns to full volume.
//
// IMPORTANT: announcements must always use the APPLICATION audio session
// (expo-speech's `useApplicationAudioSession: true`, enforced by
// AudioQueueHelper). If the shared AVSpeechSynthesizer is ever switched to
// its private session (`useApplicationAudioSession: false`), that session
// interrupts other apps' music outright (hard stop instead of ducking) and
// stays active for the lifetime of the synthesizer — iOS then re-asserts the
// active session every time the app returns to the foreground, stopping the
// user's music on every app switch.

/**
 * Delay before the speech session is released after the announcement queue
 * drains. Keeps back-to-back announcements from rapidly toggling the audio
 * session (each toggle causes an audible music volume ramp).
 */
export const SESSION_RELEASE_DELAY_MS = 1000;

/**
 * iOS refuses to deactivate an audio session while audio I/O is still
 * running (e.g. the speech synthesizer is still tearing down). Retry a few
 * times so the session never stays active — an active session would affect
 * the user's music every time the app comes to the foreground.
 */
const RELEASE_RETRY_DELAY_MS = 1000;
const MAX_RELEASE_RETRIES = 3;

/** Whether announcements must keep playing while the app is backgrounded. */
let _backgroundPlayback = false;
/** Whether the speech session is currently active. */
let _sessionActive = false;
/** Ducking flag of the currently applied speech mode (null = idle mode). */
let _sessionDucks: boolean | null = null;
let _releaseTimer: ReturnType<typeof setTimeout> | null = null;

function clearReleaseTimer(): void {
	if (_releaseTimer != null) {
		clearTimeout(_releaseTimer);
		_releaseTimer = null;
	}
}

/**
 * Apply the idle (non-speaking) audio mode. Other apps' music plays at full
 * volume; our session stays configured for background playback while a
 * recording with speech announcements is running.
 */
async function applyIdleMode(): Promise<void> {
	await setAudioModeAsync({
		shouldPlayInBackground: _backgroundPlayback,
		playsInSilentMode: _backgroundPlayback,
		interruptionMode: 'mixWithOthers',
		interruptionModeAndroid: 'duckOthers',
	});
}

/**
 * Configure the base audio session for a recording session.
 *
 * @param backgroundPlayback  true when recording starts with speech enabled
 *                            (announcements must play while backgrounded and
 *                            in silent mode), false when recording stops.
 */
export async function configureSpeechAudioSession(backgroundPlayback: boolean): Promise<void> {
	_backgroundPlayback = backgroundPlayback;
	clearReleaseTimer();
	try {
		if (_sessionActive) {
			await setIsAudioActiveAsync(false);
			_sessionActive = false;
		}
		_sessionDucks = null;
		await applyIdleMode();
	} catch (err) {
		console.warn('[SpeechAudioSession] Failed to configure audio session:', err);
	}
}

/**
 * Activate the speech session right before an announcement starts.
 *
 * @param duckOthers  true → other apps' music is lowered while speaking
 *                    (`duckOthers`); false → music keeps playing at full
 *                    volume and the announcement plays over it
 *                    (`mixWithOthers`). Never interrupts/stops other audio.
 *
 * Safe to call repeatedly; pending release timers are cancelled so
 * consecutive queue items keep one continuous session window.
 */
export async function activateSpeechSession(duckOthers: boolean): Promise<void> {
	clearReleaseTimer();
	if (_sessionActive && _sessionDucks === duckOthers) return;
	try {
		if (_sessionDucks !== duckOthers) {
			await setAudioModeAsync({
				shouldPlayInBackground: _backgroundPlayback,
				playsInSilentMode: true,
				interruptionMode: duckOthers ? 'duckOthers' : 'mixWithOthers',
				interruptionModeAndroid: 'duckOthers',
			});
			_sessionDucks = duckOthers;
		}
		if (!_sessionActive) {
			await setIsAudioActiveAsync(true);
			_sessionActive = true;
		}
	} catch (err) {
		console.warn('[SpeechAudioSession] Failed to activate speech session:', err);
	}
}

async function releaseSpeechSessionNow(attempt: number): Promise<void> {
	if (!_sessionActive) return;
	try {
		// Deactivating the session notifies other apps so their music returns
		// to full volume immediately instead of staying ducked.
		await setIsAudioActiveAsync(false);
		_sessionActive = false;
		_sessionDucks = null;
		await applyIdleMode();
	} catch (err) {
		if (attempt < MAX_RELEASE_RETRIES) {
			// Session is likely still busy (synthesizer teardown) – try again.
			clearReleaseTimer();
			_releaseTimer = setTimeout(() => {
				_releaseTimer = null;
				void releaseSpeechSessionNow(attempt + 1);
			}, RELEASE_RETRY_DELAY_MS);
		} else {
			console.warn('[SpeechAudioSession] Failed to release speech session:', err);
		}
	}
}

/**
 * Schedule the release of the speech session after the announcement queue
 * drained. Debounced by {@link SESSION_RELEASE_DELAY_MS} so a follow-up
 * announcement arriving right after keeps the session open.
 */
export function scheduleSpeechSessionRelease(): void {
	if (!_sessionActive) return;
	clearReleaseTimer();
	_releaseTimer = setTimeout(() => {
		_releaseTimer = null;
		void releaseSpeechSessionNow(0);
	}, SESSION_RELEASE_DELAY_MS);
}

import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

// ─── Speech audio session management ─────────────────────────────────────────
//
// Music from other apps must only be ducked WHILE an announcement is actually
// being spoken. Previously the audio session was configured with
// `interruptionMode: 'duckOthers'` for the entire recording, which kept other
// apps' music quiet for minutes at a time (iOS ducks as long as our session is
// active). This module keeps the session in a non-ducking base mode and only
// switches to `duckOthers` around actual speech playback.

/**
 * Delay before the ducking session is released after the announcement queue
 * drains. Keeps back-to-back announcements from rapidly toggling the audio
 * session (each toggle causes an audible music volume ramp).
 */
export const DUCKING_RELEASE_DELAY_MS = 1000;

/** Whether announcements must keep playing while the app is backgrounded. */
let _backgroundPlayback = false;
/** Whether the ducking (speech) session is currently active. */
let _duckingActive = false;
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
	_duckingActive = false;
	try {
		await applyIdleMode();
	} catch (err) {
		console.warn('[SpeechAudioSession] Failed to configure audio session:', err);
	}
}

/**
 * Activate the ducking session right before an announcement starts. Other
 * apps' music is lowered only from this point on. Safe to call repeatedly;
 * pending release timers are cancelled so consecutive queue items keep one
 * continuous ducking window.
 */
export async function activateSpeechDucking(): Promise<void> {
	clearReleaseTimer();
	if (_duckingActive) return;
	_duckingActive = true;
	try {
		await setAudioModeAsync({
			shouldPlayInBackground: _backgroundPlayback,
			playsInSilentMode: true,
			interruptionMode: 'duckOthers',
			interruptionModeAndroid: 'duckOthers',
		});
		await setIsAudioActiveAsync(true);
	} catch (err) {
		console.warn('[SpeechAudioSession] Failed to activate ducking session:', err);
	}
}

async function releaseSpeechDuckingNow(): Promise<void> {
	if (!_duckingActive) return;
	_duckingActive = false;
	try {
		// Deactivating the session notifies other apps so their music returns
		// to full volume immediately instead of staying ducked.
		await setIsAudioActiveAsync(false);
		await applyIdleMode();
	} catch (err) {
		console.warn('[SpeechAudioSession] Failed to release ducking session:', err);
	}
}

/**
 * Schedule the release of the ducking session after the announcement queue
 * drained. Debounced by {@link DUCKING_RELEASE_DELAY_MS} so a follow-up
 * announcement arriving right after keeps the session open.
 */
export function scheduleSpeechDuckingRelease(): void {
	if (!_duckingActive) return;
	clearReleaseTimer();
	_releaseTimer = setTimeout(() => {
		_releaseTimer = null;
		void releaseSpeechDuckingNow();
	}, DUCKING_RELEASE_DELAY_MS);
}

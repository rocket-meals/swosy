import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';

// ─── TTS announcement helpers ─────────────────────────────────────────────────

/**
 * Configure the audio session so that TTS announcements continue playing when
 * the app is in the background on iOS.  Call once when recording starts and
 * reset when recording stops.
 */
export async function enableBackgroundAudio(): Promise<void> {
	try {
		await setAudioModeAsync({
			shouldPlayInBackground: true,
			playsInSilentMode: true,
			interruptionMode: 'duckOthers',
			interruptionModeAndroid: 'duckOthers',
		});
	} catch (err) {
		console.warn('[TTSHelper] Failed to enable background audio:', err);
	}
}

/**
 * Reset the audio session to default settings when recording stops.
 */
export async function disableBackgroundAudio(): Promise<void> {
	try {
		await setAudioModeAsync({
			shouldPlayInBackground: false,
			playsInSilentMode: false,
			interruptionMode: 'mixWithOthers',
			interruptionModeAndroid: 'duckOthers',
		});
	} catch (err) {
		console.warn('[TTSHelper] Failed to disable background audio:', err);
	}
}

/**
 * Build a localised TTS announcement for a km milestone during recording.
 * Falls back to English for unrecognised language codes. Only the primary
 * language subtag is used (e.g. "de" from "de-DE"); regional variants are not
 * distinguished.
 *
 * @param km          Whole-kilometre milestone reached (e.g. 1, 2, 3 …)
 * @param paceMinPerKm  Current average pace in minutes/km, or null when unavailable
 * @param locale      Full BCP-47 locale tag (e.g. "de-DE", "en-US")
 */
export function buildKmAnnouncement(km: number, paceMinPerKm: number | null, locale: string): string {
	const langCode = locale.split('-')[0].toLowerCase();
	const paceMin = paceMinPerKm != null ? Math.floor(paceMinPerKm) : null;
	const paceSec = paceMinPerKm != null ? Math.round((paceMinPerKm - Math.floor(paceMinPerKm)) * 60) : null;

	switch (langCode) {
		case 'de': {
			const paceStr = paceMin != null && paceSec != null ? `, Tempo ${paceMin} Minuten ${paceSec} Sekunden pro Kilometer` : '';
			return `${km} Kilometer${paceStr}`;
		}
		case 'fr': {
			const paceStr = paceMin != null && paceSec != null ? `, allure ${paceMin} minutes ${paceSec} secondes par kilomètre` : '';
			return `${km} kilomètre${km > 1 ? 's' : ''}${paceStr}`;
		}
		case 'es': {
			const paceStr = paceMin != null && paceSec != null ? `, ritmo ${paceMin} minutos ${paceSec} segundos por kilómetro` : '';
			return `${km} kilómetro${km > 1 ? 's' : ''}${paceStr}`;
		}
		case 'it': {
			const paceStr = paceMin != null && paceSec != null ? `, passo ${paceMin} minuti ${paceSec} secondi al chilometro` : '';
			return `${km} chilometro${km > 1 ? 'i' : ''}${paceStr}`;
		}
		case 'pt': {
			const paceStr = paceMin != null && paceSec != null ? `, ritmo ${paceMin} minutos ${paceSec} segundos por quilômetro` : '';
			return `${km} quilômetro${km > 1 ? 's' : ''}${paceStr}`;
		}
		case 'nl': {
			const paceStr = paceMin != null && paceSec != null ? `, tempo ${paceMin} minuten ${paceSec} seconden per kilometer` : '';
			return `${km} kilometer${paceStr}`;
		}
		default: {
			const paceStr = paceMin != null && paceSec != null ? `, pace ${paceMin} minutes ${paceSec} seconds per kilometer` : '';
			return `${km} kilometer${km > 1 ? 's' : ''}${paceStr}`;
		}
	}
}

/**
 * Speak a TTS announcement, stopping any currently playing speech first.
 * `useApplicationAudioSession` defaults to `true` so background music is not
 * interrupted on iOS.  All other options can be overridden via the third arg.
 */
export function speakAnnouncement(
	text: string,
	languageCode: string,
	options?: Omit<Speech.SpeechOptions, 'language'>,
): void {
	Speech.stop();
	Speech.speak(text, {
		useApplicationAudioSession: true,
		...options,
		language: languageCode,
	});
}

/**
 * Build a localised TTS announcement for when the app moves to the background
 * while recording is active.
 */
export function buildBackgroundAnnouncement(locale: string): string {
	const langCode = locale.split('-')[0].toLowerCase();
	switch (langCode) {
		case 'de':
			return 'Die App läuft im Hintergrund';
		case 'fr':
			return "L'application continue en arrière-plan";
		case 'es':
			return 'La aplicación sigue en segundo plano';
		case 'it':
			return "L'app continua in background";
		case 'pt':
			return 'O aplicativo continua em segundo plano';
		case 'nl':
			return 'De app draait op de achtergrond';
		default:
			return 'The app is running in the background';
	}
}

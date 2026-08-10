import Storage from 'expo-sqlite/kv-store';

// Persisted display options of the year clock (app screen AND widget - the
// widget receives them as timeline props, since a widget cannot read the app
// storage itself).

/** Which date sits at twelve o'clock for the red year mark. */
export type YearStart = 'spring' | 'newyear';

/** How the day is displayed: the classic dot or a sun/moon horizon scene. */
export type DayDisplay = 'progress' | 'sunmoon';

export type ClockSettings = {
	yearStart: YearStart;
	dayDisplay: DayDisplay;
};

export const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
	yearStart: 'spring',
	dayDisplay: 'progress',
};

const STORAGE_KEY = 'clockSettings.v1';

export async function loadClockSettingsAsync(): Promise<ClockSettings> {
	try {
		const raw = await Storage.getItem(STORAGE_KEY);
		if (!raw) {
			return DEFAULT_CLOCK_SETTINGS;
		}
		const parsed = JSON.parse(raw) as Partial<ClockSettings>;
		return {
			yearStart: parsed.yearStart === 'newyear' ? 'newyear' : 'spring',
			dayDisplay: parsed.dayDisplay === 'sunmoon' ? 'sunmoon' : 'progress',
		};
	} catch (error) {
		console.warn('[clockSettings] load failed:', error);
		return DEFAULT_CLOCK_SETTINGS;
	}
}

export async function saveClockSettingsAsync(settings: ClockSettings): Promise<void> {
	await Storage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
